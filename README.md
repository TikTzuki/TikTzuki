# TikTzuki [![TikTuzki](./img/tik-badge.svg)](https://www.tiktuzki.com)

**Backend & platform engineer** — distributed systems, Postgres, Kubernetes. I write down what breaks in
production and how to review for it at **[tiktuzki.com](https://www.tiktuzki.com)**.

Backend engineer with 5+ years designing and scaling distributed systems, APIs and event-driven architectures,
grounded in domain-driven design. Lately: production failure modes, platform reliability, and AI-assisted
engineering workflows.

---

## What I'm building

### [tiktuzki.com](https://www.tiktuzki.com) — a production-engineering knowledge base

Documentation organised by what reading it does for you, in English and [Tiếng Việt](https://www.tiktuzki.com/vi/).

- **[Production patterns](https://www.tiktuzki.com/docs/category/production-patterns/)** — 47 lessons on failure
  modes that pass local testing and code review, then break under concurrency, retries and partial failure.
  Each ends in a review checklist.
- **[System design](https://www.tiktuzki.com/docs/category/system-design/)** — design docs, e.g.
  [service-to-service auth with Keycloak client credentials](https://www.tiktuzki.com/docs/system-design/service-auth/keycloak-client-credentials-sdd/)
  and [mTLS and workload identity with a service mesh](https://www.tiktuzki.com/docs/system-design/service-auth/mtls-service-mesh-sdd/).
- **[Operations](https://www.tiktuzki.com/docs/category/operations/)** — runbooks for the cluster below.

Source: this repo ([`tik_space/`](./tik_space)), built and deployed by GitHub Actions.

### [senior-architect](https://github.com/TikTzuki/senior-architect) — Claude Code plugins

A plugin marketplace for AI-assisted engineering. The main one,
**production-patterns**, turns the lessons above into review skills: check a diff against known production
failure modes, run a pre-deploy checklist with a GO / NO-GO verdict, or work through a system design.
Others scaffold projects (Next.js, Rust, Spring Boot), drive tmux sessions, and sync docs to Confluence or Notion.

### A production-grade platform on one node

A single-node Kubernetes homelab run like production, all of it in GitOps:

- **Postgres HA** — 3-node Patroni cluster with a connection pooler, failsafe mode for API outages, and
  **point-in-time recovery** from continuous WAL archiving to S3. The restore is drilled:
  [43 seconds](https://www.tiktuzki.com/docs/operations/backup-restore/dr-plan/) from S3 to a writable cluster.
- **Backups** — nightly, age-encrypted, to an S3 bucket with Object Lock; the host can write backups but
  never read or delete them.
- **Delivery & security** — Argo CD, Sealed Secrets, Google SSO with per-email RBAC for Grafana and Argo CD,
  Linkerd mTLS, cert-manager.
- **Observability** — Prometheus and Grafana with alerting to Telegram, from Postgres replication to backup
  freshness.

### [tiktuzki-scripts](https://github.com/TikTzuki/tiktuzki-scripts) — Rust tools

Small, sharp CLIs, released as static binaries for six targets — including **cluster-backup**, which archives,
encrypts (age) and ships the cluster's backups to S3.

---

## Stack

**Languages** — Java, Kotlin, Rust, Python, TypeScript

**Backend** — Spring, Axon Framework, FastAPI · REST, gRPC, GraphQL, WebSocket, MQTT

**Data & messaging** — PostgreSQL, Redis, Cassandra, MongoDB, Oracle · Kafka, RabbitMQ, NATS

**Platform** — Kubernetes, Helm, Argo CD, Docker, GitHub Actions · Prometheus, Grafana, ELK · Keycloak

---

## Contact

[tiktuzki.com](https://www.tiktuzki.com) · [LinkedIn](https://www.linkedin.com/in/tiktuzki/) · tiktuzki@gmail.com
