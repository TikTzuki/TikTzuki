# Redis caching strategy

Bên trong database của hệ thống chứa một danh sách các đồng coin, khi người dùng muốn tìm một đồng coin bất kì, người dùng sẽ gõ vào ô tìm kiếm. Mỗi lần người dùng gõ thêm một ký tự, hệ thống trả về một danh sách gợi ý các đồng coin chứa các ký từ người dùng đã gõ vào.
Hãy thiết kế một chiến lược caching hỗ trợ gợi ý kết quả khi người dùng gõ vào ô tìm kiếm.
![image](https://pivx.org/media/news/0001/01/thumb_630_news_article.png)

<br/>

## Read-through Strategy
Khi có yêu cầu đọc dữ liệu, Redis cache sẽ được kiểm tra trước. Nếu dữ liệu có trong cache (cache hit), dữ liệu sẽ được trả về ngay lập tức. Nếu không, dữ liệu sẽ được đọc từ nguồn dữ liệu chính, sau đó được lưu vào cache trước khi trả về cho ứng dụng.

```mermaid
flowchart TD
    NODE_1["NODE_1"]
    NODE_2["NODE_2"]
    Redis["Redis"]
    MySQL["MySQL XXX"]

    NODE_1 -- "2\. set db" --> MySQL
    NODE_1 -- "1\. del cache" --> Redis
    NODE_2 -- "3\. miss cache" --> Redis
    NODE_2 -- "4\. read db" --> MySQL
    NODE_2 -- "5\. set cache" --> Redis

    %% Arrow colors
    linkStyle 0 stroke:#b71c1c,stroke-width:2px
    linkStyle 1 stroke:#b71c1c,stroke-width:2px
    linkStyle 2 stroke:#388e3c,stroke-width:2px
    linkStyle 3 stroke:#388e3c,stroke-width:2px
    linkStyle 4 stroke:#388e3c,stroke-width:2px

    %% Node border colors
    style NODE_1 stroke:#800080,stroke-width:2px
    style NODE_2 stroke:#228B22,stroke-width:2px
    style Redis stroke:#d32f2f,stroke-width:2px
    style MySQL stroke:#1976d2,stroke-width:2px
```
