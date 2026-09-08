---
title: Back-of-the-Envelope Estimation
tags: [distributed-systems, tier-2-distributed]
sidebar_position: 2
---

# Back-of-the-envelope estimation

An estimate is not a prediction. It is a **filter**: a way to find out, in two minutes and before
any code exists, whether a design is off by 10× or off by 1000×. Being wrong by 2× is fine and
expected. Being wrong by three orders of magnitude is the thing this catches.

## The numbers to hold

Powers of two, because storage and addressing are binary:

| Power | Approx        | Bytes |
|------:|---------------|-------|
|  2^10 | 1 thousand    | 1 KB  |
|  2^20 | 1 million     | 1 MB  |
|  2^30 | 1 billion     | 1 GB  |
|  2^40 | 1 trillion    | 1 TB  |
|  2^50 | 1 quadrillion | 1 PB  |

Time, rounded aggressively:

- **86,400 seconds/day → call it 100,000.** The 16% error is irrelevant and the division gets easy.
- 2.5 million seconds/month. 30 million seconds/year.
- 1 request/second sustained ≈ **2.5 million requests/month**.

Sizes, for sanity:

| Thing                   | Order of magnitude |
|-------------------------|--------------------|
| UUID                    | 16 B               |
| Timestamp               | 8 B                |
| A row of scalar columns | 100 B – 1 KB       |
| A JSON API response     | 1 – 10 KB          |
| A web page with assets  | 1 – 2 MB           |
| A photo                 | 1 – 5 MB           |
| A minute of 1080p video | ~50 MB             |

## The method

Always the same five steps, in the same order.

1. **Users.** Total, then daily active. If you are not told, assume DAU is 10–20% of registered.
2. **Actions per user per day.** State it out loud — this is the assumption most likely to be wrong,
   and the one worth arguing about.
3. **Average QPS** = DAU × actions ÷ 100,000.
4. **Peak QPS.** Multiply average by 2–10×. Traffic is never flat; pick the multiplier from the
   domain (a consumer social feed peaks harder than an internal tool; a trading venue peaks at the
   open).
5. **Storage and bandwidth** = QPS × bytes per item, then × retention, then × replication factor.

Step 5 is where estimates most often go wrong, because replication is forgotten. Three replicas
means three times the disk, and the write bandwidth is paid three times too.

## Worked example: the WebSocket gateway

Taking the real targets from the
[WebSocket Gateway Cluster SDD](../../system-design/websocket-gateway/cluster-sdd.mdx) —
100K concurrent connections, ≥ 50,000 msg/s per gateway node, P95 under 100 ms — and checking
whether they are internally consistent.

**Do the connections fit?**

100,000 concurrent WebSocket connections. A connection costs, roughly, a socket plus read and write
buffers — call it 10–50 KB of kernel and heap per connection once buffers are counted.

```
100,000 conns x 30 KB = 3 GB
```

So connection state alone is a few GB. That fits on one large machine, but leaves little headroom
and makes that machine a blast radius. The SDD's decision to spread across gateway nodes is not
premature — the napkin says a single node is within one order of magnitude of the limit, which is
exactly the zone where you shard.

**Does the throughput target make sense?**

50,000 msg/s per node, at ~200 B per market-data message:

```
50,000 x 200 B = 10 MB/s per node  =  80 Mbps
```

Comfortable on a 1 Gbps NIC, trivial on 10 Gbps. So **throughput is not the constraint** — the
target is bounded by per-message CPU (serialisation, fan-out bookkeeping), not by the network. That
tells you where to look when it underperforms, and it tells you the rate limit in the SDD
(200 burst, ~100/s sustained per client) is about protecting the CPU, not the link.

**Does the latency budget survive?**

P95 ≤ 100 ms end to end. From the
[latency numbers](latency-numbers.md), a datacenter round trip is ~0.5 ms:

```
ingest -> broker -> gateway -> client
  ~0.5 ms   ~0.5 ms   ~0.5 ms      = ~1.5 ms of network
```

Under 2 ms of the 100 ms budget is network. **98% of the budget is queuing, GC pauses and fan-out
work.** Which means a latency regression here will never be fixed by moving services closer
together, and the multi-region option in the SDD would blow the budget outright: one
cross-continent hop is 150 ms, which is over budget before anything is computed.

That last conclusion took thirty seconds of arithmetic and is worth more than a week of profiling
the wrong layer.

## Common ways to get it wrong

- **Estimating with averages.** Capacity is sized for peak. An average-QPS answer is off by the
  peak multiplier, usually 3–10×.
- **Forgetting fan-out.** One write that notifies 1,000 followers is 1,001 operations. Read-heavy
  and fan-out-heavy systems are where naive estimates fail hardest.
- **Forgetting replication.** ×3 on storage, and on write bandwidth.
- **Forgetting indexes.** They frequently equal or exceed the size of the data.
- **Precision theatre.** Carrying 3 significant figures through an estimate whose input assumption
  was a guess. Round hard and early; it makes the arithmetic checkable in your head, and the
  spurious precision was never real.

## When to stop

Stop as soon as the number has answered the question. The useful outputs are usually just:

- Does this fit on one machine, or is it inherently distributed?
- Is it bounded by CPU, memory, disk or network?
- Is the latency budget mostly network, or mostly our own code?

Anything past that is design work, and belongs in an
[SDD](../../system-design/templates/sdd-template.mdx) rather than on the napkin.

## Sources

- [The System Design Primer — back-of-the-envelope calculations](https://github.com/donnemartin/system-design-primer#back-of-the-envelope-calculations).
- [Latency numbers](latency-numbers.md) for the constants used above.
