---
title: "Session Consistency: Read-Your-Writes, Monotonic Reads & Causal Order"
tags:
  - storage
  - distributed-systems
  - tier-2-distributed
sidebar_position: 3
---

# Session Consistency: Read-Your-Writes, Monotonic Reads và Causal Order

**Quy tắc: "eventually consistent" không phải là một cam kết bạn có thể đưa cho người dùng.**
Mỗi read path buộc phải chọn một trong ba cam kết ở phía client, và mặc định — route read tới
replica bất kỳ — không cam kết điều nào cả.

Thuộc nhóm storage: [storage engines](/docs/production-patterns/storage-engines) ·
[indexes & query plans](/docs/production-patterns/indexes-and-query-plans) ·
[replication & sharding](/docs/production-patterns/replication-and-sharding) · **session consistency** (file này) ·
[connection pools & latency](/docs/production-patterns/connection-pools-and-latency)

## Nội dung

- [Anti-pattern](#anti-pattern)
- [Ba cam kết, ba triệu chứng khác nhau](#ba-cam-kết-ba-triệu-chứng-khác-nhau)
- [Vì sao môi trường dev che mất lỗi này](#vì-sao-môi-trường-dev-che-mất-lỗi-này)
- [Nó vỡ như thế nào trên production](#nó-vỡ-như-thế-nào-trên-production)
- [Cách làm đúng](#cách-làm-đúng)
- [Giá phải trả của từng cơ chế](#giá-phải-trả-của-từng-cơ-chế)
- [Checklist review](#checklist-review)

## Anti-pattern

```
write   ──> primary
read    ──> load balancer ──> replica A | replica B | replica C   (round robin)
```

> "Read đi vào replica. Dữ liệu là eventually consistent, không sao — vài trăm milisecond thì
> ai quan tâm."

Có một người quan tâm, và với người vừa bấm Lưu thì nó chưa bao giờ chỉ là "vài trăm
milisecond". Sau câu nói đó là ba lỗi riêng biệt, và sửa một lỗi không sửa hai lỗi còn lại.

Dấu hiệu trong diff: một read được route vào replica pool mà **không có bất kỳ liên hệ nào với
write vừa xảy ra trước nó** — không version token, không session pinning, không ép về primary.
Code đúng. Database đúng. Người dùng bị nói dối.

## Ba cam kết, ba triệu chứng khác nhau

Đây không phải ba mức độ của cùng một thứ. Chúng là ba cam kết khác nhau với phạm vi khác
nhau, và đạt được cái nghe có vẻ mạnh hơn không kéo theo hai cái còn lại.

| Cam kết                                 | Nội dung cam kết                                  | Triệu chứng khi thiếu            | Phạm vi                                 |
|-----------------------------------------|---------------------------------------------------|----------------------------------|-----------------------------------------|
| **Read-after-write** (read-your-writes) | Nếu *bạn* ghi, *bạn* thấy                         | "Tôi vừa lưu mà không thấy đâu"  | một client, một write                   |
| **Monotonic reads**                     | Đã thấy version N thì không bao giờ thấy cũ hơn N | "Con số đi giật lùi"             | một client, xuyên thời gian và thiết bị |
| **Causal consistency**                  | Nếu A gây ra B, không ai thấy B mà chưa thấy A    | "Câu trả lời hiện trước câu hỏi" | giữa nhiều client                       |

Cái bẫy cần nhớ: **read-after-write không kéo theo monotonic reads.** Bạn ép mọi read sau
write về primary, người dùng vẫn thấy thời gian đi lùi — họ ghi trên điện thoại, rồi mở laptop,
và read của laptop rơi vào một replica đang lag. Cùng một người, cùng một tài khoản, hai
session, hai vị trí khác nhau trên dòng thời gian.

Và **monotonic reads không kéo theo causal consistency.** Bạn có thể đảm bảo một người dùng
không bao giờ thấy dữ liệu tụt lùi, mà vẫn hiển thị cho người thứ ba một comment trước bài
đăng mà nó trả lời. Monotonic reads là cam kết với *chính bạn*; causal consistency là cam kết
về *quan hệ giữa nhiều người*.

## Vì sao môi trường dev che mất lỗi này

Mọi cơ chế sinh ra lỗi này đều không tồn tại ở local.

- **Replication lag bằng 0** vì chỉ có một node. Write và read chạm cùng một file dữ liệu.
- **Không có load balancer**, nên không có chuyện hai read liên tiếp rơi vào hai replica ở hai
  vị trí khác nhau.
- **Một browser, một tab.** Kịch bản cross-device làm vỡ monotonic reads cần hai client, và
  không ai test theo cách đó.
- **Test seed dữ liệu rồi đọc.** Rất ít khi write rồi read lại *trong* cửa sổ lag, vì ở local
  không có cửa sổ nào cả.
- **Staging chỉ có một replica**, nên "đọc từ replica" được test trên đúng một node thường
  đang rảnh, lag cỡ microsecond.

Vì vậy lỗi xuất hiện lần đầu trên production, ở read path, với dashboard xanh mướt — không
5xx, không slow query, không log lỗi. Database không sai. Chỉ có góc nhìn của người dùng về nó
là sai.

## Nó vỡ như thế nào trên production

### 1. Cái write "không hề xảy ra"

Người dùng sửa địa chỉ giao hàng cho một đơn 2.000 USD và nhận được "Cập nhật thành công". Họ
refresh để kiểm tra; read rơi vào replica đang lag và hiện lại địa chỉ cũ.

Thiệt hại không phải cái render cũ — mà là hành động tiếp theo của con người. Họ cho rằng lưu
thất bại và **submit lại**. Giờ có hai luồng write cho một ý định: hai event đổi địa chỉ, hai
lần tính lại phí vận chuyển, hai email thông báo. Một guard chống duplicate dựa trên bản ghi
chưa replicate xong sẽ không bắt được, vì chính nó cũng đọc từ replica.

Đây là race condition mà một bên tham gia là con người. Logic idempotency đọc từ replica thì
không phải logic idempotency — xem
[payment state & idempotency](/docs/production-patterns/payment-state-and-idempotency).

### 2. Thời gian đi giật lùi

Số dư ví hiện 100M sau khi nạp, 50M ở lần refresh kế tiếp, rồi lại 100M. Dữ liệu không sai;
hai read liên tiếp rơi vào hai replica ở hai vị trí khác nhau, vì load balancer chạy round
robin và các replica lag không đều nhau.

Chỗ nó thôi là lỗi hiển thị: bất kỳ màn hình nào người dùng **hành động dựa trên nó**. Một mức
giá trông như đang giảm vì replica cũ trả về sẽ dụ người ta đặt lệnh trên một mức giá không
còn tồn tại. Lệnh bị từ chối, hoặc khớp ở nơi họ không hề muốn. Đó là vấn đề tài chính và
pháp lý khoác áo bug UI.

### 3. Kết quả đến trước nguyên nhân

Alice đăng bài; Bob comment vào bài đó. Người thứ ba thấy comment của Bob mà phía trên không có
bài nào. Cả hai bản ghi đều commit, đều replicate. Chúng chỉ đến theo thứ tự khác nhau, vì đi
hai đường độc lập — hai replica lag khác nhau, hoặc hai Kafka partition được consume bởi các
service đang chịu tải khác nhau.

Cùng một hình dạng, với tiền: push "thanh toán thành công" đến trước khi bản ghi ledger đọc
được, nên người dùng mở app và thấy tiền đã trừ mà không có giao dịch nào giải thích. Xem
[message delivery semantics](/docs/production-patterns/message-delivery-semantics) để hiểu vì sao thứ tự trong một
partition không phải thứ tự toàn hệ thống.

### 4. Failover rewind

Asynchronous replication nghĩa là replica được promote có thể thiếu đúng những write cuối cùng
mà primary cũ đã xác nhận. Khi failover, **toàn bộ** client nhảy lùi cùng lúc — không phải một
session không may. Sticky routing không cứu được; chính dòng thời gian đã dịch chuyển.

Đây là failure mode làm cho "chúng tôi ghim user vào một replica" không đủ để gọi là một câu
trả lời về consistency. Hãy định lượng nó bằng RPO và đối chiếu với thứ mà business tin là đã
durable — [replication & sharding](/docs/production-patterns/replication-and-sharding) nói về phần durability.

### 5. Chuyển vùng (cross-region handoff)

Session pinning gần như luôn chỉ có phạm vi trong một region. Một người dùng đổi region — đi
công tác, bật VPN, DNS resolve lại, mạng di động handoff — sẽ đến một tập replica ở vị trí hoàn
toàn khác trên stream, và có thể thấy trạng thái từ trước vài write gần nhất của họ. Mọi cơ chế
stickiness đều cần câu trả lời rõ ràng cho việc target bị mất hoặc nằm ở region khác, và "route
họ đi đâu cũng được" chính là vi phạm monotonic reads.

### 6. Thêm replica làm mọi thứ tệ hơn

Phản xạ khi primary quá tải là thêm read replica. Mỗi replica thêm vào là một đích nữa mà
primary phải đẩy change stream tới. Đến một điểm nào đó, chính fan-out là bottleneck, lag tăng
trên tất cả replica, và **thay đổi để cải thiện hiệu năng lại nới rộng cửa sổ không nhất quán.**
Scale read và giữ consistency kéo nhau về hai phía; một kế hoạch chỉ nói đến điều đầu tiên là
kế hoạch chưa xong.

## Cách làm đúng

### Bước 1 — phân loại từng read path

Không phải read nào cũng cần cùng một cam kết, và giả định rằng có là lý do người ta với tay
sang strong consistency rồi bỏ giữa đường vì quá đắt.

| Read path                                          | Cần                |
|----------------------------------------------------|--------------------|
| Người dùng đọc dữ liệu của chính họ, hoặc vừa sửa  | read-after-write   |
| Màn hình người dùng theo dõi hoặc refresh liên tục | monotonic reads    |
| Nơi một bản ghi giải thích cho bản ghi khác        | causal consistency |
| Aggregate, feed dữ liệu của người khác, analytics  | eventual là đủ     |

### Bước 2 — chọn cam kết yếu nhất vẫn giữ được invariant

Strong consistency ở mọi nơi là cách sửa ngây thơ: mọi write chờ quorum xuyên region, hệ thống
chạy bằng tốc độ của node chậm nhất và dừng hẳn khi có network partition. Global two-phase
commit để đảm bảo thứ tự cũng là sai lầm đó với nhiều bước hơn. Bạn không cần mọi thứ đúng thứ
tự — chỉ cần những thứ **có liên quan** đúng thứ tự.

### Bước 3 — dùng version token, đừng dùng stickiness

Có ba cơ chế cho read-after-write và monotonic reads. Ưu tiên cái thứ ba.

**Đọc từ primary cho read của chủ sở hữu.** Đơn giản và đúng. Nhưng nếu mọi user xem trang cá
nhân của mình đều vào primary, bạn đã trả lại toàn bộ lợi ích của replica. Chấp nhận được như
một luật hẹp (cài đặt tài khoản, trạng thái KYC), không phải như một chiến lược.

**Sticky session.** Hash `user_id` về một replica cố định tại load balancer. Rẻ, và thật sự cho
monotonic reads — dòng thời gian của một replica chỉ tiến lên. Nhưng nó mang tính xác suất: cam
kết bay hơi khi node đó chết, nó tạo hot replica khi các heavy user hash trùng nhau, và
rebalance mà vẫn giữ stickiness là việc thực sự khó.

**Version token (nên dùng).** Làm cho vị trí trở nên tường minh, thay vì suy ra từ routing:

1. Write thành công trả về vị trí của primary — LSN, commit timestamp, hoặc một token opaque.
2. Application lưu nó theo session (cookie, session store, response header).
3. Các read sau gửi kèm token.
4. Proxy hoặc middleware so token với vị trí đã apply của replica ứng viên, rồi **chờ** replica
   bắt kịp, **reroute** sang replica đã bắt kịp, hoặc fallback về primary.

Cách này chỉ đọc primary khi thật sự cần, sống sót qua việc một replica chết, và không tạo hot
spot. Đây chính là thứ mà các tier "session consistency" của cloud làm sẵn cho bạn.

### Bước 4 — với causal order, hãy track dependency, không track wall clock

Đồng hồ giữa các server luôn lệch, nên timestamp không xác lập được "happened before". Hãy mang
theo dependency: comment ghi lại id và version của bài đăng nó trả lời. Ở phía read, nếu kết quả
đến mà nguyên nhân chưa thấy được, **buffer kết quả lại** đến khi nguyên nhân xuất hiện, thay vì
render một bản ghi mồ côi. Lamport clock hoặc vector clock tổng quát hoá việc này khi dependency
không phải một parent hiển nhiên.

### Bước 5 — degrade một cách tường minh, đừng nói dối

Khi hệ thống phát hiện không thể giữ cam kết — token của client mới hơn mọi replica truy cập
được — hãy hiển thị đúng điều đó. Một trạng thái "đang đồng bộ…" là chi phí UX nhỏ. Một banner
thành công giả rồi kèm dữ liệu cũ thì làm mất niềm tin, và kích hoạt đúng cái hành vi submit lại
biến một vấn đề thành hai.

Liên quan: đừng báo thành công cho việc chưa thật sự hiển thị được. Hãy mô hình hoá nó thành một
trạng thái mà client có thể poll —
[async & long-running operations](/docs/production-patterns/api-async-operations).

## Giá phải trả của từng cơ chế

| Cơ chế              | Được                                           | Mất                                                             |
|---------------------|------------------------------------------------|-----------------------------------------------------------------|
| Đọc từ primary      | read-after-write                               | mất lợi ích replica trên path đó                                |
| Sticky replica      | monotonic reads, giá rẻ                        | hot replica; mất cam kết khi node chết hoặc đổi region          |
| Version token + chờ | read-after-write và monotonic reads, chính xác | tail latency khi chờ; proxy phải biết vị trí replica            |
| Causal metadata     | kết quả không bao giờ đến trước nguyên nhân    | metadata phình theo độ sâu dependency; logic buffer; việc prune |

Không cơ chế nào miễn phí khi failover. Mỗi cái đều cần câu trả lời rõ ràng cho "làm gì khi
target đã ghim hoặc đã bắt kịp không còn nữa".

## Checklist review

- [ ] Với mỗi read path bị sửa: nó cần cam kết nào trong ba cam kết, và cái gì thực thi cam kết
  đó? "Eventually consistent" không phải câu trả lời cho một owner read.
- [ ] Read xảy ra ngay sau write trong cùng một hành động của người dùng có đi vào primary, có
  mang version token, hay không có gì cả?
- [ ] Có guard chống duplicate hoặc idempotency nào **đọc từ replica** không? Nó có thể không
  thấy chính bản ghi trước đó trong cửa sổ lag.
- [ ] Read routing có phải round robin trên replica pool cho một màn hình người dùng refresh
  liên tục? Đó là vi phạm monotonic reads đang chờ lag lệch nhau.
- [ ] Client có giữ version/session token xuyên thiết bị, hay tính monotonic được giả định từ
  routing?
- [ ] Nơi một bản ghi giải thích bản ghi khác (comment→post, notification→ledger,
  refund→charge), dependency có được ghi lại và kết quả có được buffer đến khi nguyên nhân
  hiển thị được?
- [ ] Đường notification và đường dữ liệu có độc lập nhau? Một push có thể chạy nhanh hơn read
  model thì sẽ chạy nhanh hơn.
- [ ] RPO công bố là bao nhiêu, và cú rewind khi failover có phá vỡ cam kết nào đã hứa ở nơi
  khác trong sản phẩm?
- [ ] Nếu dùng sticky routing: chuyện gì xảy ra khi replica đó không truy cập được, và cái gì
  ngăn các heavy user hash về cùng một node?
- [ ] Thay đổi này có thêm replica? Nếu có, tác động lên fan-out và lag đã được xét chưa, chứ
  không chỉ read throughput thu được?
- [ ] Khi không giữ được cam kết, UI có nói ra điều đó, hay vẫn hiện dữ liệu cũ dưới một thông
  báo thành công?

---

*Chủ đề khởi nguồn từ series Replication & Scaling (P1–P7) trên
[TechCraft](https://www.patreon.com/c/TechCraft). Series nêu ba cam kết và cung cấp các kịch bản
lỗi — ảnh đại diện và địa chỉ giao hàng, số dư đi giật lùi, thứ tự comment, failover rewind và
nghịch lý fan-out khi thêm replica. Cấu trúc review, cách phân loại read path và checklist được
viết từ thực hành đã được kiểm chứng, không phải dịch lại từ nguồn.*
