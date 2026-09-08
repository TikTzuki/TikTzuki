---
title: Latency Numbers
tags: [distributed-systems, tier-2-distributed]
sidebar_position: 1
---

# Latency numbers worth memorising

The point of knowing these is not recall for its own sake. It is being able to reject a design in
thirty seconds, before anyone builds it — *"that is four cross-region round trips on the read path,
so the floor is 600 ms, so no."*

The absolute values drift with hardware. **The ratios barely move**, and the ratios are what the
arithmetic needs.

## The table

Jeff Dean's numbers, with what each one actually tells you.

| Operation                          |       Time | What it means for a design                                                                  |
|------------------------------------|-----------:|---------------------------------------------------------------------------------------------|
| L1 cache reference                 |     0.5 ns | Free. Never reason about it.                                                                |
| Branch mispredict                  |       5 ns | Free unless you are writing a hot inner loop.                                               |
| L2 cache reference                 |       7 ns | ~14× L1. Still free.                                                                        |
| Mutex lock/unlock                  |      25 ns | Cheap *uncontended*. Contention is a different problem entirely.                            |
| Main memory reference              |     100 ns | ~200× L1. This is where cache-miss cost starts being visible.                               |
| Compress 1 KB (Snappy)             |      10 µs | Compressing before a network hop is almost always worth it.                                 |
| Send 1 KB over 1 Gbps              |      10 µs | Serialisation cost, not distance.                                                           |
| Read 4 KB randomly from SSD        |     150 µs | ~1,500× main memory.                                                                        |
| Read 1 MB sequentially from memory |     250 µs |                                                                                             |
| **Round trip within a datacenter** | **500 µs** | The unit of distributed-systems cost. Memorise this one.                                    |
| Read 1 MB sequentially from SSD    |       1 ms | ~4× the same read from memory.                                                              |
| Disk seek (HDD)                    |      10 ms | 20× a datacenter round trip. Going to spinning disk is worse than going to another machine. |
| Read 1 MB sequentially from 1 Gbps |      10 ms |                                                                                             |
| Read 1 MB sequentially from HDD    |      30 ms |                                                                                             |
| **Packet CA → Netherlands → CA**   | **150 ms** | The speed of light is not negotiable.                                                       |

Derived throughput, which is often the more useful form:

|                 | Sequential throughput |
|-----------------|-----------------------|
| HDD             | 30 MB/s               |
| 1 Gbps Ethernet | 100 MB/s              |
| SSD             | 1 GB/s                |
| Main memory     | 4 GB/s                |

And the two that end most arguments:

- **~2,000 round trips per second** within a datacenter.
- **~6–7 round trips per second** around the world.

## Scaled to human time

Multiply everything by a billion, so 1 ns becomes 1 second. The shape of the problem becomes
obvious:

| Operation                 | Human scale         |
|---------------------------|---------------------|
| L1 cache reference        | 0.5 s — a heartbeat |
| Main memory reference     | 1.7 minutes         |
| SSD random read           | 1.7 days            |
| Datacenter round trip     | 5.8 days            |
| Disk seek                 | 16 weeks            |
| Cross-Atlantic round trip | **4.8 years**       |

A cache miss is a coffee break. A cross-region call is a university degree.

## Which of these have aged

The list dates from around 2012. Treat it as *orders of magnitude that still hold*, with three
caveats where the hardware genuinely moved:

- **Network bandwidth.** 1 Gbps was the assumption. 10 and 25 Gbps are ordinary inside a datacenter
  now, so the "send 1 KB" and "read 1 MB over the network" rows are pessimistic by roughly 10–25×.
- **SSDs.** NVMe changed the picture: sequential reads of several GB/s and random 4 KB reads well
  under 100 µs are normal. The row is pessimistic by a few times.
- **Spinning disks.** Largely gone from latency-sensitive paths. The 10 ms seek is still the right
  number for the archival tier, and still the right reason not to put it on a read path.

What has *not* changed, and will not: main memory around 100 ns, a datacenter round trip around
0.5 ms, and the cross-continent figure, which is bounded by physics rather than engineering.

## The three rules that fall out

1. **Memory, disk and network are decades apart, not percentages apart.** Optimising the wrong
   layer by 20% is noise next to removing one round trip.
2. **Sequential beats random by a lot, at every layer.** This is why storage engines are shaped the
   way they are — see [storage engines](../../production-patterns/storage-engines.md).
3. **Distance is a hard floor.** No amount of caching, threading or protocol cleverness gets a
   packet across the Atlantic faster than ~75 ms each way. If a design needs a synchronous
   cross-region hop on the critical path, the latency budget is already spent.

## Where this gets used

- [Back-of-the-envelope estimation](back-of-the-envelope.md) — turning these into a capacity number.
- [The network & latency](../../production-patterns/network-and-latency.md) — how latency composes
  across services, and why sequential dependencies add up faster than people expect.
- [Connection pools & latency](../../production-patterns/connection-pools-and-latency.md) — where
  the round-trip cost actually shows up in application code.

## Sources

- [Latency numbers every programmer should know](https://gist.github.com/jboner/2841832) — the
  original gist.
- [Designs, lessons and advice from building large distributed systems](http://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf)
  — Jeff Dean, LADIS 2009, where the numbers come from.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know).
