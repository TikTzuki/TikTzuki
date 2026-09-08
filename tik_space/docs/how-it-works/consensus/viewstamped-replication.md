---
title: Viewstamped Replication (VSR)
tags: [consensus, distributed-systems, tier-2-distributed]
sidebar_position: 2
---

# Viewstamped Replication (VSR)

VSR is a **state machine replication** protocol designed to keep a group of replicas consistent even when some fail. It
was originally proposed by **Brian Oki and Barbara Liskov** in 1988, with a revised version ("Viewstamped Replication
Revisited") published by Liskov and Cowling in 2012.

## Core Idea

A cluster of `2f + 1` replicas can tolerate `f` failures. One replica is the **primary** (leader), the rest are *
*backups**. All client requests go through the primary, which ensures replicas execute operations in the same order.

## Key Concepts

**View** — A numbered epoch during which one specific replica is the primary (e.g., view 0 → replica 0 is primary, view
1 → replica 1, etc.). When the primary fails, the system moves to a new view with a new primary.

**Op-number** — A sequence number assigned to each client operation, ensuring total ordering.

**Commit-number** — The highest op-number that has been replicated to a majority and is safe to execute.

## Normal Operation (3 phases)

```
Client          Primary              Backups
  │                │                    │
  │── Request ────▶│                    │
  │                │── Prepare(op) ────▶│   (1) Primary assigns op-number
  │                │                    │       and sends to all backups
  │                │◀── PrepareOK ─────│   (2) Backups log it, reply OK
  │                │                    │
  │                │  (majority replied) │   (3) Primary commits, advances
  │◀── Reply ─────│── Commit ─────────▶│       commit-number, replies to client
```

1. **Prepare** — Primary assigns an op-number, appends to its log, sends
   `⟨PREPARE, view, op-number, operation, commit-number⟩` to backups
2. **PrepareOK** — Each backup appends to its log, replies `PrepareOK`
3. **Commit** — Once the primary gets `f` PrepareOK responses (majority), it commits the operation, executes it, and
   replies to the client

## View Change (Leader Failure Recovery)

When a backup suspects the primary is dead (timeout):

1. **StartViewChange** — Backup broadcasts `⟨START_VIEW_CHANGE, new-view⟩`
2. **DoViewChange** — Once `f` replicas agree, they send their logs to the new primary:
   `⟨DO_VIEW_CHANGE, log, view, ...⟩`
3. **StartView** — New primary picks the most up-to-date log, broadcasts `⟨START_VIEW, new-log, new-view⟩` to all
   replicas

The new primary has all committed operations because any committed op was stored on a majority, and the view change
requires a majority — these two majorities **must overlap**.

## VSR vs Paxos vs Raft

|                       | VSR                                                   | Paxos                             | Raft                                     |
|-----------------------|-------------------------------------------------------|-----------------------------------|------------------------------------------|
| **Year**              | 1988                                                  | 1989                              | 2014                                     |
| **Leader-based**      | Yes                                                   | Multi-Paxos is, basic Paxos isn't | Yes                                      |
| **Understandability** | Moderate                                              | Notoriously hard                  | Designed for clarity                     |
| **View change**       | Explicit view-change protocol                         | Leader election varies            | Term-based election with log comparison  |
| **Core insight**      | Same as Paxos — quorum intersection guarantees safety | Quorum intersection               | Same, but with stronger log restrictions |

VSR and Raft are actually quite similar in spirit — both are leader-based, log-replication protocols. Raft can be seen
as a refinement of VSR with clearer rules around log consistency. Paxos is more general but harder to implement as a
full system.

## TL;DR

VSR ensures replicas agree on the **same sequence of operations** by funneling everything through a primary, replicating
to a majority before committing, and using a quorum-based view change protocol to survive primary failures — all without
losing any committed operations.