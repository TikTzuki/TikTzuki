---
title: Availability Patterns
tags: [distributed-systems, tier-2-distributed]
sidebar_position: 3
---

# Availability patterns

Availability is arithmetic before it is architecture. The arithmetic is worth doing first, because
it usually shows that the redundancy being proposed is aimed at the wrong component.

## Nines

| Availability         | Downtime/year | Downtime/month | Downtime/day |
|----------------------|---------------|----------------|--------------|
| 99% (two nines)      | 3d 15h 36m    | 7h 18m         | 14m 24s      |
| 99.9% (three nines)  | 8h 45m 57s    | 43m 50s        | 1m 26s       |
| 99.99% (four nines)  | 52m 36s       | 4m 23s         | 8.6s         |
| 99.999% (five nines) | 5m 15s        | 26s            | 0.9s         |

Two things fall out of that table immediately.

**Four nines is an on-call promise, not an architecture.** 52 minutes a year is less than one bad
deploy. It cannot be reached without automated rollback and automated failover, because a human
being paged at 3 a.m. cannot diagnose and fix anything inside that budget.

**Five nines is almost never the real requirement.** 26 seconds a month does not survive a single
kernel upgrade. Before designing for it, check whether the business actually meant "we should not
lose data", which is a durability requirement and a completely different problem.

## Composition: the part people get wrong

### In sequence, availability multiplies

If a request must pass through both components, and either can fail it:

```
A_total = A_1 x A_2 x ... x A_n
```

Two 99.9% components in sequence give **99.8%**. Ten of them give **99.0%** — from nine hours of
downtime a year to three and a half days, without any single component getting worse.

This is why a request path crossing many services is fragile in a way no individual service owner
can see. [The network & latency](../../production-patterns/network-and-latency.md) works the same
example from the latency side; it is the same arithmetic.

### In parallel, unavailability multiplies

If either replica can serve the request:

```
A_total = 1 - (1 - A_1) x (1 - A_2)
```

Two 99.9% components in parallel give **99.9999%**. Redundancy is extraordinarily effective —
*provided the failures are independent*, which is the assumption that keeps being false. Two
replicas in the same rack, on the same power feed, running the same buggy build, deployed by the
same pipeline, are not independent. The correlated failure is what takes the service down, and no
amount of replication addresses it.

**Practical consequence:** shorten the sequential path before adding parallel redundancy. Removing
one hop from a five-service chain buys more availability than adding a second replica of one of
them.

## Failover

### Active–passive

Heartbeats run between an active server and a standby. When they stop, the passive one takes over
its IP and begins serving. Also called master–slave failover.

Downtime is however long detection plus promotion takes. If the passive server is kept warm, that
is seconds; if it is cold, it is however long a start-up takes.

### Active–active

Both nodes serve traffic. Load is shared, and failure removes capacity rather than causing an
outage. Also called master–master failover.

Requires the application to tolerate its own state being handled on either node — sessions,
sticky routing and write conflicts all become live concerns. Both nodes must also be provisioned to
carry the whole load alone, or the failover simply moves the outage from availability to overload.

### What failover costs, both ways

- **Data loss.** If replication is asynchronous, whatever was in flight when the active node died
  is gone. This is a durability decision disguised as an availability decision.
- **Complexity.** Failover is code that runs only during incidents, which means it is the least
  tested code in the system.
- **Split brain.** Two nodes both believing they are active. This is the failure that corrupts data
  rather than merely stopping service, and avoiding it is precisely what quorum protocols are for —
  see [consensus & leader election](../../production-patterns/consensus-and-leader-election.md) and
  [Raft](../consensus/raft.md).

## Replication

The two shapes, and what each is actually for:

|          | Master–slave      | Master–master                    |
|----------|-------------------|----------------------------------|
| Writes   | One node          | Any node                         |
| Reads    | Any node          | Any node                         |
| Scales   | Reads             | Reads and writes                 |
| Cost     | Read replicas lag | Write conflicts must be resolved |
| Failover | Promote a replica | Already active                   |

Master–slave is the right default. It scales the read path, which is usually the one under
pressure, and it has no conflict-resolution problem because there is one writer. Master–master
should be a response to a demonstrated write-throughput or write-locality problem, not a starting
point — you are trading a solved problem for an unsolved one.

Depth on the trade-offs, including sharding, is in
[replication & sharding](../../production-patterns/replication-and-sharding.md).

## Sources

- [Designing for failure](../../production-patterns/designing-for-failure.md) — the prescriptive
  companion to this page.
- [The System Design Primer — availability patterns](https://github.com/donnemartin/system-design-primer#availability-patterns).
