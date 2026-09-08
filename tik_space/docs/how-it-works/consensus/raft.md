---
title: Raft
tags: [consensus, distributed-systems, tier-2-distributed]
sidebar_position: 1
---

# ⚖️ Why Consensus Is Hard

* Network messages can be delayed, reordered, or lost.
* Servers can crash and restart.
* Without consensus, two servers might think they are the "truth," leading to data divergence.

Raft solves this by electing **one leader** and having all followers trust it.

---

# 🏗️ The Core Ideas of Raft

### 1. **Leader Election**

* At any time, one server is the **leader**, others are **followers**.
* Followers start an **election** if they don’t hear from a leader within a timeout.
* Votes are requested; the one with the majority becomes leader.
* **Guarantee:** only one leader at a time.

---

### 2. **Log Replication**

* Clients send requests (commands) to the leader.
* The leader **appends** the command to its log and replicates it to followers.
* Once a majority acknowledges, the leader **commits** the entry.
* Followers also commit that entry.

✅ This ensures that all nodes eventually have the **same ordered log**.

---

### 3. **Safety Rules**

* **Election restriction:** Candidates must have the latest log to win leadership.
* **Log matching:** If two logs have an entry at the same index and term, they’re identical before that point.
* **Commitment:** Only entries known by a majority are committed.

---

# 🔄 Raft States

Each server cycles between 3 roles:

1. **Follower** → passive, just waits for leader’s messages.
2. **Candidate** → requests votes during election.
3. **Leader** → handles client requests, replicates logs.

---

# 📊 Timeline Example

```
Initial state: 5 servers, no leader
↓
Timeout (no heartbeat received)
↓
One follower becomes Candidate, requests votes
↓
Majority vote → Leader elected
↓
Client: "SET x=10"
↓
Leader appends log [SET x=10], replicates to followers
↓
Majority responds OK → Leader commits entry
↓
Followers commit entry → State is consistent
```

---

# 🛠️ Where Raft Is Used

* **etcd** (Kubernetes metadata store)
* **Consul** (HashiCorp service discovery)
* **TiKV** (Rust-based distributed KV store, uses raft-rs)
* **Databend** (uses openraft)

---

# 🎯 Key Takeaways

* Raft = **Consensus via Leadership**.
* Only leader talks to clients.
* Majority (quorum) ensures fault tolerance.
* Handles crashes, restarts, partitions.
* Simpler than Paxos, but equally powerful.

---
