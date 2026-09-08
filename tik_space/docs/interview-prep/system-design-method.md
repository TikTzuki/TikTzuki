---
title: System Design Method
tags: [distributed-systems, tier-4-system-design]
sidebar_position: 4
---

# A method for system design questions

Open-ended by construction: *"design Twitter"* has no correct answer, and the interviewer is not
looking for one. They are watching whether you can drive an ambiguous problem to a defensible
design and say why you chose each part.

Four steps. Do not skip step 1 — it is the one that separates candidates, and the one most people
rush.

## Step 1 — Constraints and use cases

Never start drawing. Spend the first several minutes establishing what is being built. Write the
answers down where both of you can see them; they are the contract you will be judged against.

Ask:

- **Which use cases are in scope?** Force a shortlist. "Users post tweets, users view a timeline" is
  a design; "everything Twitter does" is not.
- **Who and how many?** DAU, and how much each does per day.
- **Read-heavy or write-heavy?** Determines almost every later decision. A 100:1 read:write ratio
  points at caching and denormalisation; write-heavy points at partitioning and queues.
- **How consistent must it be?** Per operation, not globally — see
  [consistency models](../how-it-works/distributed-systems/consistency-models.md).
- **What is the latency target,** and for which percentile?
- **What is explicitly out of scope?** Auth, payments, moderation, analytics. Say it, so you are not
  penalised for the omission.

Then turn the answers into numbers on the board — QPS, peak QPS, storage per year, bandwidth — using
[back-of-the-envelope estimation](../how-it-works/estimation/back-of-the-envelope.md). Those numbers
are what makes the rest of the discussion concrete rather than a recitation of components.

State your assumptions out loud as assumptions. An interviewer will correct a wrong one, which is
useful. An unstated one just makes the design wrong.

## Step 2 — High-level design

Boxes and arrows, nothing more. Client, load balancer, application tier, data store, cache, queue.

The bar is not the diagram, it is that **you can justify every box and delete any box you cannot**.
A cache in the drawing before anyone has established a read pattern is a mark against you, not for
you. Sketch it, then walk one request through it end to end and one write through it end to end.

## Step 3 — Core components

Pick the two or three pieces that carry the actual difficulty and go deep. Typically:

- **Data model.** Tables or collections, key fields, and the access patterns each index serves.
  Index choices follow from the queries — [indexes & query plans](../production-patterns/indexes-and-query-plans.md).
- **API surface.** A handful of endpoints with their parameters. Get the resource modelling and
  pagination right; the reviewer's version of this is
  [API contracts](../production-patterns/api-contracts.md) and
  [list endpoints](../production-patterns/api-list-endpoints.md).
- **The one hard invariant.** Every interesting system has one thing that must not go wrong —
  a balance that must not go negative, an order that must not double-charge, a timeline that must
  not lose a post. Name it and say how it is enforced. This is the single highest-signal thing you
  can do in the whole interview. See
  [consistency boundaries](../production-patterns/consistency-boundaries.md) and
  [payment state & idempotency](../production-patterns/payment-state-and-idempotency.md).

## Step 4 — Scale it

Only now. The correct order is **find the bottleneck, then address it** — and the discipline is
visible: a candidate who adds a cache, a shard and a queue without first identifying what is
saturating is guessing.

Use the estimates from step 1 to say where it breaks first, then reach for the appropriate tool:

| Bottleneck                    | Tool                                | Depth                                                                                                                                              |
|-------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Read throughput               | Cache, read replicas                | [caching](../production-patterns/caching.md)                                                                                                       |
| Write throughput / data size  | Sharding                            | [replication & sharding](../production-patterns/replication-and-sharding.md)                                                                       |
| Slow work on the request path | Queue, async workers                | [async operations](../production-patterns/api-async-operations.md)                                                                                 |
| Abusive or bursty clients     | Rate limiting                       | [rate limiting](../production-patterns/rate-limiting.md)                                                                                           |
| Dependency failure            | Timeouts, retries, circuit breakers | [timeouts & retries](../production-patterns/timeouts-and-retries.md), [circuit breakers](../production-patterns/circuit-breakers-and-bulkheads.md) |

For each one, state the cost as well as the benefit. Caching introduces invalidation and staleness;
sharding breaks cross-shard queries and transactions; queues turn a synchronous error into a
delivery-semantics problem ([message delivery semantics](../production-patterns/message-delivery-semantics.md)).
Naming the cost is what shows the choice was made rather than pattern-matched.

## What is being assessed

Roughly, in order:

1. **Do you scope before designing?** Step 1.
2. **Can you justify decisions,** including the ones you rejected?
3. **Do you know the costs** of the patterns you reach for?
4. **Can you find your own bottleneck** rather than waiting to be told?
5. Breadth of components — last, and much less important than the above.

## The written-up form

The same structure, done properly and with the decisions recorded, is a design document. The
template used here is [the SDD template](../system-design/templates/sdd-template.mdx), and
[the WebSocket Gateway Cluster SDD](../system-design/websocket-gateway/cluster-sdd.mdx) is a
worked example of it with real numbers.

## Sources

- [The System Design Primer — how to approach a system design interview question](https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question),
  which also carries seven fully worked solutions (Pastebin, Twitter timeline, web crawler, Mint,
  a key-value store, sales ranking, and scaling to millions of users on AWS).
