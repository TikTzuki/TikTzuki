---
id: intro
title: Start here
sidebar_position: 0
slug: /intro
---

# Start here

These docs are filed by **what reading them will do for you**, not by subject. That is the
only axis that works here, because the same subject shows up in very different forms — the
consensus problem appears as an explainer about Raft, as a review checklist about leader
election, and as a runbook for a Patroni cluster that has to elect one for real.

So pick the shelf that matches what you need right now, then use tags to cut across.

| Section                                                       | What it does for you                                                                                   | Read it when                                                          |
|---------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| **[How it works](/docs/category/how-it-works)**               | Explains a mechanism that exists in the world. Timeless, not prescriptive, not about anything I built. | You want to understand something                                      |
| **[Production patterns](/docs/category/production-patterns)** | Prescriptive. Names a failure mode that working code exhibits, and what to check for it in a diff.     | You are reviewing or designing and want to not get bitten             |
| **[System design](/docs/category/system-design)**             | A design record for one specific system I built. Descriptive, dated, not reusable.                     | You want to know how a particular thing was built, or need a template |
| **[Operations](/docs/category/operations)**                   | Imperative and perishable. Steps to run against a real machine.                                        | You are operating the cluster, or rebuilding it                       |
| **[Interview prep](/docs/category/interview-prep)**           | Drill material to self-test against.                                                                   | You are preparing for or running an interview                         |
| **[Reference](/docs/category/reference)**                     | Pointers outward to other people's work.                                                               | You want the good link, not my explanation                            |

## Cutting across

The directory says what kind of document it is; **[tags](/docs/tags)** say what it is about.
That is where a subject reassembles itself across the shelves — `consensus` collects the
Raft explainer, the leader-election review lesson and the Patroni topology in one place, and
no folder structure can do that.

Two facets:

- **Topic** — [payments](/docs/tags/payments), [transactions](/docs/tags/transactions),
  [storage](/docs/tags/storage), [runtime](/docs/tags/runtime),
  [distributed systems](/docs/tags/distributed-systems),
  [API design](/docs/tags/api-design), [cryptography](/docs/tags/cryptography),
  [kubernetes](/docs/tags/kubernetes) and others.
- **Tier** — a reading *order*, from
  [Tier 1 Foundations](/docs/tags/tier-1-foundations) through
  [Tier 2 Distributed](/docs/tags/tier-2-distributed) to
  [Tier 4 System design](/docs/tags/tier-4-system-design). Each document is tagged with the
  earliest tier at which it makes sense, so these are entry points rather than a full index.

If you are working through the production patterns deliberately rather than looking one up,
the tier tags are the order to do it in. Learning the right thing at the wrong time is what
stalls people.

## Where this comes from

Three repositories, one site. Each document is owned by whichever repo can break the thing
it describes, and the site publishes copies:

| Section             | Source of truth                                                                                                                 |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Production patterns | [`senior-architect`](https://github.com/TikTzuki/senior-architect) — a Claude Code plugin that reads these as review references |
| Operations          | [`tiktuzki-gitops`](https://github.com/TikTzuki/tiktuzki-gitops) — docs live beside the manifests they describe                 |
| Everything else     | [`TikTzuki`](https://github.com/TikTzuki/TikTzuki) — this site                                                                  |
