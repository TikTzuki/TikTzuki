---
title: Consistency Models
tags: [transactions, distributed-systems, tier-2-distributed]
sidebar_position: 2
---

# Consistency models

A consistency model is a **contract about what a read is allowed to return**. It is not a quality
setting, and "more consistent" is not "better" — every step up the ladder is paid for in latency,
availability, or both.

## First, disambiguate the word

"Consistency" names two unrelated things, and conflating them causes real design errors.

|             | The C in ACID                                                     | The C in CAP                     |
|-------------|-------------------------------------------------------------------|----------------------------------|
| Scope       | One database, one transaction                                     | Many replicas of one value       |
| Means       | The transaction leaves the DB satisfying its declared constraints | Every read sees the latest write |
| Enforced by | Constraints, triggers, the application                            | Replication protocol             |

They are orthogonal. A single Postgres node gives you ACID-C and has no CAP-C problem, because
there is nothing to replicate. This page is about the CAP sense.
[Consistency boundaries](../../production-patterns/consistency-boundaries.md) makes the
prescriptive version of the same argument.

## The three broad levels

### Weak consistency

After a write, reads may or may not see it. No guarantee, no convergence promise.

Sounds useless, and is exactly right for anything where the *next* value supersedes the last:
live video, VoIP, real-time multiplayer position updates. If a packet is lost there is no point
replaying it — by the time it arrives it is wrong. Memcached behaves this way by design.

### Eventual consistency

Reads may be stale, but **in the absence of new writes, all replicas converge**. The staleness
window is typically milliseconds.

This is the default for high-availability systems: DNS, S3, Cassandra, most caches and search
indexes. It is what AP means in practice.

Eventual consistency is where the surprising bugs live, because "eventually" permits sequences that
look impossible to a user:

- Write a comment, refresh, comment is gone.
- See a reply before the message it replies to.
- Read a value, read again, get an *older* value.

Which is why the useful vocabulary is finer than three levels.

### Strong consistency

Every read reflects all writes that completed before it. The system behaves as if there were one
copy. Formally, **linearizability**.

This is what a quorum protocol buys you: [Raft](../consensus/raft.md),
[VSR](../consensus/viewstamped-replication.md), etcd, ZooKeeper, Spanner. The price is a round trip
to a quorum on every operation, and unavailability of the minority side during a partition — see
[CAP](cap-theorem.md).

## The session guarantees that actually matter

Most user-visible weirdness is fixed without going all the way to linearizability. These are cheap,
and worth naming explicitly in a design:

| Guarantee             | Promise                                      | Fixes                              |
|-----------------------|----------------------------------------------|------------------------------------|
| **Read-your-writes**  | You always see your own writes               | "I posted it and it vanished"      |
| **Monotonic reads**   | You never see time go backwards              | Refresh showing older data         |
| **Monotonic writes**  | Your writes apply in the order you made them | Edits landing out of order         |
| **Consistent prefix** | You never see an effect before its cause     | Reply appearing before the message |

Read-your-writes plus monotonic reads covers the large majority of complaints, and both are usually
implementable by pinning a user's session to one replica, or by routing that user's reads to the
primary for a few seconds after a write. Neither requires consensus.

## Choosing

The question is never "how consistent should the system be". It is **which invariant, and what does
a violation of it cost**:

- Violation costs money or is legally binding → strong. Ledger balances, inventory, seat allocation.
- Violation is visible to one user and confusing → eventual, plus the session guarantee that removes
  the confusion.
- Violation is invisible or immediately superseded → weak. Metrics, presence, live feeds.

Different fields of the same record can sit in different rows of that table, and usually should.

## Sources

- Doug
  Terry, [Replicated data consistency explained through baseball](https://www.microsoft.com/en-us/research/publication/replicated-data-consistency-explained-through-baseball/)
  — the clearest treatment of the session guarantees.
- Martin Kleppmann, *Designing Data-Intensive Applications*, ch. 5 and 9.
- [The System Design Primer — consistency patterns](https://github.com/donnemartin/system-design-primer#consistency-patterns).
