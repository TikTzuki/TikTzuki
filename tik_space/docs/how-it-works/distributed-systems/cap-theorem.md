---
title: CAP Theorem
tags: [distributed-systems, consensus, tier-2-distributed]
sidebar_position: 1
---

# CAP theorem

CAP is the most cited and most misquoted result in distributed systems. The popular version —
*"pick two of three"* — is wrong in a way that makes it useless in practice.

## What it actually says

Three properties:

- **Consistency** — every read returns the most recent write, or an error. (Linearizability. This is
  *not* the C in ACID; see [consistency models](consistency-models.md).)
- **Availability** — every request receives a non-error response, with no guarantee it is the most
  recent value.
- **Partition tolerance** — the system keeps operating when the network drops or delays messages
  arbitrarily between nodes.

The theorem: **when a partition occurs, you cannot have both consistency and availability.**

## Why "pick two of three" is a misreading

Partition tolerance is not a property you choose. It is a property of the network, and the network
is not reliable — see the first fallacy in
[the network & latency](../../production-patterns/network-and-latency.md). If nodes talk over a
network, partitions will happen. Choosing "CA" means choosing to be a single machine.

So the real choice is narrower and far more useful:

> **When a partition happens, do you refuse the request, or serve a possibly-stale answer?**

That is a one-bit decision, and it only applies *during* a partition. The rest of the time — which
is nearly all the time — CAP says nothing at all.

## CP — refuse the request

The minority side of the partition stops answering. Reads and writes on that side fail or block
until the partition heals.

Choose this when a wrong answer is worse than no answer: ledgers, balances, inventory that cannot
oversell, anything where a stale read becomes a financial or legal fact.

Consensus protocols are how CP systems are built. A quorum-based protocol keeps the majority side
live and forces the minority side to step down — that is exactly what
[Raft](../consensus/raft.md) and [Viewstamped Replication](../consensus/viewstamped-replication.md)
do. The unavailability is not a bug in those protocols; it *is* the C in CAP being honoured.

## AP — answer anyway

Every side of the partition keeps serving from whatever it has. Writes are accepted on both sides
and reconciled once the partition heals, which means you now need a conflict-resolution story:
last-write-wins, vector clocks, CRDTs, or a human.

Choose this when staleness is survivable and downtime is not: caches, feeds, presence, metrics,
product catalogues, session state.

## What CAP does not tell you

CAP is scoped to one failure mode. It is silent on the case that dominates your life:
**the system is healthy, and you still have to choose.** Replicating synchronously to another region
costs 150 ms ([latency numbers](../estimation/latency-numbers.md)); replicating asynchronously
costs correctness. CAP has no opinion, because there is no partition.

**PACELC** is the extension that covers it:

> **if P**artition, then **A** or **C**; **E**lse, then **L**atency or **C**onsistency.

That second clause is the one you trade against every day. A system is usefully described as, say,
*PC/EL* — consistent under partition, latency-favouring when healthy.

Two further limits worth knowing:

- **It is not per-system, it is per-operation.** A payments platform is CP on the ledger write and
  AP on the transaction-history read. Classifying the whole system is a category error — draw the
  boundary per invariant, which is the argument in
  [consistency boundaries](../../production-patterns/consistency-boundaries.md).
- **Availability in CAP is not uptime.** CAP-availability means *every* node answers *every*
  request. A system with 99.99% uptime can be CP: see
  [availability patterns](availability-patterns.md) for the operational meaning.

## Sources

- Gilbert & Lynch, [Brewer's conjecture and the feasibility of consistent, available,
  partition-tolerant web services](https://users.ece.cmu.edu/~adrian/731-sp04/readings/GL-cap.pdf) —
  the formal proof.
- Eric
  Brewer, [CAP twelve years later: how the rules have changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)
  — the author disowning the "two of three" reading.
- Daniel
  Abadi, [Consistency tradeoffs in modern distributed database design](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf) —
  PACELC.
- [The System Design Primer — CAP theorem](https://github.com/donnemartin/system-design-primer#cap-theorem).
