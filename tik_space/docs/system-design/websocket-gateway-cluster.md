# Websocket Gateway Cluster SDD

## 1. Document Control

* **Document Version**: 1.0
* **Date**: August 18, 2025
* **Author(s)**: TikTuzki
* **Reviewed by**: [Reviewer Name]
* **Approved by**: [Approver Name]
* **Status**: Draft

---

## 2. Introduction

### 2.1 Purpose

High-performance WebSocket service for streaming events to end users in a Centralized Exchange (CEX) system, robust, scalable, and low-latency architecture.

### 2.2 Scope

This System Design Document (SDD) covers the architecture, design, and implementation of a high-performance WebSocket service for streaming real-time events to end users in a Centralized Exchange (
CEX) system.

**In Scope:**

- Integration with external event sources (Kafka, NATS, Redis Streams) to deliver event streams
  (Depth data, Depth data, trading pairs Realtime Data, trading pairs Kline Data, BBO (Best Bid and Offer Data)) to clients via WebSocket.
- Support for massive concurrency (100K+ connections), low-latency delivery (\<100ms), horizontal scalability, and optional multi-region deployment.
- Authentication (API-KEY/ListenKey), routing logic, transformation/mapping layers, fault tolerance, and observability (metrics, logging, dashboards).
- Management layer (admin dashboard for monitoring/configuration), deployment strategies (Kubernetes orchestration), and integration with external systems (authentication service).
- Functional and non-functional requirements, including security, reliability, and monitoring.
- Detailed use cases: handshake/authentication, topic subscription/unsubscription, trade action via websocket, event streaming, backpressure handling, private streams, and resume support on reconnect.

### 2.3 References

HashKey Websocket [API Documentation](https://hashkeyglobal-apidoc.readme.io/reference/ws-v2-trade)\
Binance Websocket [API Documentation](https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams)

## 3. System Overview

### 3.1 System Context

* System Context diagram

```mermaid
graph TD
    subgraph UI["Admin Dashboard"]
    end

    WSCluster(("WebSocket Gateway Cluster"))
    Clients <--->|" Websocket "| WSCluster
    UI <--->|" Monitor & Control "| WSCluster
```

### 3.2 Objectives & Success Criteria

- Concurrent Connections: \>= 100,000 connections.
- Latency: P95 \<= 100ms.
- Throughput: >= 50,000 msg/s gateway node.
- Availability: 99.99% uptime.
- Scalability: Scale horizontally to add capacity with zero downtime. Sharing domain with multiple cluster.
- Monitoring Coverage: critical metrics (connections, latency, errors) are monitored and alerted.
- Compliance: Pass all security and compliance audits (e.g., GDPR, PCI DSS) for data protection.

## 4. Architectural Design

### 4.1 Technology Stack

| **Layer**                          | **Technology**                  | **Purpose**                                                      |
|------------------------------------|---------------------------------|------------------------------------------------------------------|
| **Frontend (Client-Facing)**       | HAProxy                         | TCP/HTTP load balancing, connection distribution, health checks. |
| **Core WebSocket Cluster**         | Rust (tokio, tungstenite, axum) | High-performance async runtime for WebSocket servers.            |
|                                    | async-rate-limiter              | Rate limiting for abuse prevention.                              |                                                                 |
| **Dynamic config storage**         | Redis                           | Dynamic config, detect peer join/left, negotiation communication |
| **Replication / Fanout Messaging** | NATS                            | Cross-region replication, replay capability.                     |
| **Admin & Management**             | Next.js (UI)                    | Web-based admin dashboard.                                       |

### 4.2 Architecture Overview

```mermaid
graph TD
%% External Inputs
    EventSources["Event Sources<br/>• Kafka<br/>• NATS"]
    Replication["Replication Layer<br/>• NATS"]
    CS["Dynamic Config Storage<br/>• Redis"]
%% Core System
    HAProxy["HAProxy Cluster (Load Balancers)"]
    WS[["WebSocket Cluster"]]
    Admin["Admin Dashboard"]
%% Connections
    EventSources -->|" Consume "| WS
    Replication <-->|" pub/sub "| WS
    Admin <-->|" Monitor & Config "| WS
    HAProxy <-->|" TCP "| WS
    WS <--> CS
```

* **HAProxy Cluster (Load Balancers)**

    * Provides **TCP load balancing** across the WebSocket server cluster.
    * Distributes client connections evenly across available nodes.
    * Can perform **health checks** and **automatic failover** if a WebSocket node goes down.

* **WebSocket Cluster**

    * The heart of the system — handles **client WebSocket connections**, **subscription management**, and **event delivery**.
    * Key responsibilities:

        1. **Consume** from upstream event sources (Kafka,NATS,...).
      2. **Publish/subscribe** internally via NATS replication layer to ensure all nodes are in sync.
        3. **Route events** to the correct connected clients based on subscription rules.
        4. **Apply mapping logic** (format transformation, filtering).
        5. **Scale horizontally** — each node is stateless with respect to client routing.

* **Admin Dashboard**

    * Provides an operational view of the WebSocket cluster.
    * Functions:

        * Monitor connection counts, per-stream latency, event throughput.
        * Configure routing/mapping rules dynamically.
        * Control replication and scaling.
    * Connects directly with the WebSocket cluster for both **monitoring** and **configuration changes**.

### 4.3 Subsystems & Components

Break down into major components/modules:

* Name
* Responsibility
* Interfaces
* Dependencies

### 4.4 Data Design

#### Summary Table: Data Flow Elements

| Component                                                   | Description                                                                   |
|-------------------------------------------------------------|-------------------------------------------------------------------------------|
| [**Connection**](#connection-flow-diagram)                  | WebSocket setup with endpoint (with listenKey if connect to User data stream) |
| [**Ping–Pong**](#ping-pong-flow-diagram)                    | Keep-alive frames: client send ping to server every 10s.                      |
| [**Subscription**](#subscription-flow-diagram)              | JSON subscribe/unsubscribe/list commands for streams                          |
| [**Market data Streams**](#market-data-stream-flow-diagram) | Trade, kline, ticker, depth, liquidation, mark price, etc.                    |
| [**User Data**](#user-data-private-stream-flow-diagram)     | Separate connection for account/order/position updates via listen key         |

#### Connection Flow Diagram

- Connecting

```mermaid
flowchart TD
    Start([Start])
    Connecting["Connecting"]
    Connected["Connected"]
    Closing["Closing"]
    End([End])
    Start --> Connecting
    Connecting -- " OK " --> Connected
    Connected -- " Client close / server drain " --> Closing
    Closing --> End
```

- Connecting with listenKey

```mermaid
flowchart TD
    Start([Start])
    Connecting["Connecting"]
    Authenticated["Authenticated"]
    Rejected["Rejected"]
    Closing["Closing"]
    End([End])
    Start --> Connecting
    Connecting -- " listenKey OK " --> Authenticated
    Connecting -- " listenKey invalid " --> Rejected
    Authenticated -- " Client close / server drain " --> Closing
    Authenticated -- " listenKey expired " --> Closing
    Rejected --> Closing
    Closing --> End
```

#### Ping-Pong Flow Diagram

```mermaid
flowchart TD
    Client["Client"]
    Server["Server"]
    loopStart((Every 10s))
    Client -- " Ping " --> Server
    Server -- " Pong " --> Client
    loopStart -.-> Client
```

#### Market Data Stream Flow Diagram

```mermaid
flowchart TD
    Kafka["Kafka / NATS (Market Data Sources)"]
    Replication["Replication Layer (NATS)"]
    WS["WebSocket Cluster"]
    Client["Client"]
    Kafka -- " Publish trade/kline/depth/markPrice " --> WS
    WS -- " Fanout via Replication Layer " --> Replication
    Replication -- " Distribute events to all WS nodes " --> WS
    WS -- " Push filtered topic event " --> Client
```

#### Apply route & mapping rule

```mermaid
flowchart TD
    Admin["Admin Dashboard"]
    WSNode["WebSocket Node"]
    ConfigStore["Config Store (Redis)"]
    Routing["Routing Engine"]
    Mapping["Mapping Layer"]
    Admin -- " Add/Update Mapping Rule (via API/UI) " --> WSNode
    WSNode -- " Persist rule " --> ConfigStore
    ConfigStore -- " Notify change event " --> WSNode
    WSNode -- " Reload mapping rules " --> Routing
    Routing -- " Apply mapping " --> Mapping

```

#### Subscription Flow Diagram

#### User Data Private Stream Flow Diagram


#### Config update event handling

When a `WS Node` consumes a `config_update` event from the `Config Store`, it hot-reloads only the affected components (data sources, topics, routes, mappings) without interrupting live traffic.


```mermaid
flowchart TD
    Start([Start])
    Evt["Receive config_update event"]
    Validate{"Schema + version OK?"}
    Find["Determine affected components<br/>datasource | topics | routes | mappings"]
    Branch{"Can update in-place?"}
    ApplyChange["Apply changes"]
    DS["Update connectors"]
    TR["Reload topics"]
    ML["Reload mappers"]
    Done([Done])
    Start --> Evt --> Validate
    Validate -- Yes --> Find --> Branch
    Branch -- Yes --> ApplyChange
    ApplyChange --> DS
    ApplyChange --> TR
    ApplyChange --> ML
    DS --> Done
    TR --> Done
    ML --> Done

```

## 5. Detailed Design

### 5.1 UML: WebSocket Node Internal Structure

```mermaid
classDiagram
    class Orchestrator {
        onDynamicConfigUpdate()
    }

    class IngestionAdapter {
    }
    IngestionAdapter <|.. KafkaAdapter
    IngestionAdapter <|.. NatsAdapter

    class DataMapper
    DataMapper <|.. ChildrenDataMapper

    class FanoutPublisher
    FanoutPublisher <|.. NatsFanoutPublisher
    FanoutPublisher <|.. NatsStreamFanoutPublisher

    class FanoutConsumer {
    }
    FanoutConsumer <|.. NatsFanoutConsumer
    FanoutConsumer <|.. NatsStreamFanoutConsumer
    WsTopic o-- FanoutConsumer

    class WsTopic {
        +topic
        +rate
        +burst
        +WsOutTx[] subscribers
        + List fanoutConsumers
        + broadCastMessage(msg)
        + sendDirectToUserConnections()
        + authorize(listenKey)
    }

    WsTopic <|.. PublicTopic
    WsTopic <|.. PrivateTopic

    class WsServer {
        +Map of WsOutRx connections
        +Map of WsTopicTask subscriptions
        +onListenKeyUpdate()
        +onNewConnection()
        +authorize(listenKey)
    }
    WsServer o-- WsTopic
```

### 5.2 Routing, Mapping

Sample of routing and mapping configuration:

```json
{
  "datasource": [
    {
      "version": 1,
      "type": "kafka",
      "name": "default_kafka",
      "properties": {
        "bootstrap.servers": "kafka:9092",
        "group.id": "websocket_gateway_group",
        "auto.offset.reset": "earliest"
      }
    },
    {
      "version": 1,
      "type": "nats",
      "name": "default_nats",
      "properties": {
        "servers": [
          "nats://nats:4222"
        ],
        "max_reconnect_attempts": 10,
        "reconnect_time_wait": 2
      }
    }
  ],
  "topics": [
    {
      "version": 1,
      "topic": "btcusdt@trade",
      "rate": 20,
      "burst": 60,
      "auth": "public"
    },
    {
      "version": 1,
      "topic": "btcusdt@depth",
      "auth": "public"
    },
    {
      "version": 1,
      "topic": "balance",
      "rate": 20,
      "burst": 60,
      "auth": "private"
    }
  ],
  "routes": [
    {
      "id": "uuid4",
      "version": 1,
      "peer_id": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
      "data_source": "default_kafka",
      "mappings": [
        {
          "mapper": "trade_v1",
          "fanout_topic": "fanout.trade.btcusdt",
          "ws_topic": "btcusdt@trade"
        },
        {
          "mapper": "depth_v2",
          "fanout_topic": "fanout.depth.btcusdt",
          "ws_topic": "btcusdt@depth"
        },
        {
          "mapper": "balance",
          "fanout_topic": "fanout.balance",
          "ws_topic": "balance"
        }
      ]
    }
  ]
}
```

#### 5.2.1 Negotiation algorithm

##### Update single config

```mermaid
sequenceDiagram
    participant PeerA
    participant PeerB
    participant Redis
    Note over Redis: Initial State: None
    PeerA ->> Redis: WATCH config:{key}
    PeerA ->> Redis: HGETALL config:{key} -> version=1
    PeerB ->> Redis: WATCH config:{key}
    PeerB ->> Redis: HGETALL config:{key} -> version=1
    PeerA ->> Redis: MULTI
    PeerA ->> Redis: HSET value="v2", version=2, last_updated_by="PeerA"
    PeerA ->> Redis: XADD config_events * key config:{key} value new_value version new_version updated_by peer_id
    PeerA ->> Redis: EXEC
    Redis -->> PeerA: OK
    Note over Redis: config:{key} updated: version=2, value="v2", last_updated_by="PeerA"
    PeerB ->> Redis: MULTI
    PeerB ->> Redis: HSET value="v2", version=2, last_updated_by="PeerB"
    PeerB ->> Redis: EXEC
    Redis -->> PeerB: nil (transaction aborted)
    PeerB ->> Redis: UNWATCH
    Redis -->> PeerA: Stream message (config_events)
    Redis -->> PeerB: Stream message (config_events)
```

```mermaid
sequenceDiagram
    autonumber
    participant Redis as Config Store (Redis)
    participant Node as WS Node
    participant Orc as Orchestrator
    participant DS as DataSourceManager
    participant TR as Topics
    participant ML as Mappers
    Redis -->> Node: Stream message config_events {keys, version, correlation_id}
    Node ->> Orc: onConfigUpdate(event)
    Orc ->> Orc: deduplicate/versionCheck()

    par Apply affected changes
        Orc ->> DS: applyDataSourceChanges(keys)
        DS -->> Orc: applied
    and
        Orc ->> TR: reloadTopics(keys)
        TR -->> Orc: applied
    and
        Orc ->> ML: reloadMappings(keys)
        ML -->> Orc: applied
    end

    Orc ->> Redis: XACK config_events <id>
```

##### When a peer leaves - re-balance config algorithm

0. PeerA know PeerC leaves cluster.
1. PeerA acquire lock "peer-left:peer_id" on redis key

- if success, publish "peer_left:peer_id" event to redis stream "peer_update_queue"
- else abort

2. PeerA or PeerB consume "peer_update_queue" event -> rebalance datasource -> update routing config with [Update single config](#update-single-config) logic & remove "peer-left:peer_id".

##### When a peer join - re-balance config algorithm

1. PeerC online, publish "peer_join:peer_id" event to redis stream "peer_update_queue"
2. PeerA or PeerB consume "peer_update_queue" event -> rebalance datasource -> update routing config with [Update single config](#update-single-config) logic

### 5.3 Listen key

Sample structure:

```json
{
  "userId": "12345",
  "iat": 1713543000,
  // issued at
  "exp": 1713546600,
  // expires in 60 min
  "scope": "user:stream"
}
```

Create then connect with listenKey

```mermaid
flowchart TD
    subgraph API
        A[POST /listenKey] --> B[Generate random listenKey]
        B --> C[Store in Redis exp=+60m]
        C --> D[Return listenKey]
    end
```

```mermaid
flowchart TD
    subgraph Websocket
        E[Client connects with listenKey] --> I[WS Node extracts listenKey]
        I --> G[Redis GET listenKey:<token>]
        G -->|Found & not expired| F[Allow connection]
        G -->|Not found / expired| H[Reject 401 INVALID_LISTENKEY]
    end
```

Revoke listenKey

```mermaid
flowchart TD
    subgraph API
        A[DELETE /listenKey] --> B[Redis DEL listenKey:<token>]
        B --> C[Redis PUBLISH listenKey.revoke event]
    end

```

```mermaid
flowchart TD
    subgraph WebSocket Nodes
        D[WS Node subscribed to listenKey.revoke] --> E[Receive event]
        E --> F[Lookup connections with listenKey]
        F -->|Found| G[Send WS close frame 4011 & cleanup]
        F -->|Not Found| H[No-op]
    end
```

Reset validity listenKey

```mermaid
flowchart TD
    subgraph API
        A[PUT /listenKey] --> B[Redis EXISTS?]
        B -->|Yes| C[Redis EXPIRE listenKey:<token> now+60m]
        C --> D[Redis PUBLISH listenKey.reset event]
        B -->|No| E[Return error -1125 INVALID_LISTENKEY]
    end
```

```mermaid
flowchart TD
    subgraph WebSocket Nodes
        F[WS Node subscribed to listenKey.reset] --> G[Receive event]
        G --> H[Update local session expiry]
        H --> I[Client keep connection with refreshed listenKey]
    end 
```

## 6. Integration & Interfaces

### Config data source.

![jhDatasource](./img/datasource_config.svg)

### Config websocket topics.

![Topic Config](./img/topic_config.svg)

### Config a routing & mapping per data source.

![Route Config](./img/route_config.svg)

## 7. Security Design

Updating...

## 8. Performance & Scalability

Ref [3.2 Objectives--success-criteria](#32-objectives--success-criteria)

## 9. Reliability & Availability

Ref [3.2 Objectives--success-criteria](#32-objectives--success-criteria)

### 9.1 Rate limiter

#### 9.1.1 Rate Limit

- Defines the average speed at which tokens are added into the bucket.
- Example: 100 tokens/sec → the system allows 100 actions per second on average.

#### 9.1.2 Burst (Bucket Capacity)

- Defines the maximum number of tokens the bucket can hold.
- Allows short bursts of traffic above the average rate — as long as the bucket has accumulated tokens.

Example:

- Rate = 100 tokens/sec
- Burst = 200
- A client can send 200 messages instantly (if tokens were accumulated), but then will be throttled to ~100/sec afterward

#### 9.1.3 Outbound Rate Limiting (server → client)

- Each connection has a send queue.
- Apply per-connection limiter before pushing into queue.
- If over limit → drop message or coalesce (e.g., compress order book deltas).

## 10. Deployment & Infrastructure

Target deployment architecture:

```mermaid
graph TD
    ClusterA((Market data cluster <br/> /ws/quote/v1))
    ClusterB((User data cluster <br/> /api/ws/user))

```

Future migration:

```mermaid
graph TD
    ClusterA1((Spot Market data<br/>))
    ClusterA2((Spot User data<br/>))
    ClusterB1((USDT Future Market data<br/>))
    ClusterB2((USDT Future User data<br/>))
```

```mermaid
graph TD
    ClusterC1((USD Future Market data<br/>))
    ClusterC2((USD Future User data<br/>))
    ClusterD((Announcement Cluster<br/>))
```

## 11. Non-Functional Requirements

Updating...

## 12. Risks & Mitigations

### 12.1 Infrastructure Risks

* **Redis Single Point of Failure (SPOF)**

    * *Risk*: Redis is central for dynamic configuration, listenKey lifecycle, and peer coordination. Outage or partition leads to stalled config updates and failed authentication.
    * *Mitigation*:

        * Deploy Redis in **cluster mode with sentinel/raft consensus** for automatic failover.
        * Enable persistence (AOF) for recovery.
        * Use Redis connection pooling and retry logic in clients.

* **NATS Partitioning / Message Loss**

    * *Risk*: Network partitions or broker node failure may cause missed replication messages or inconsistent state across WebSocket nodes.
    * *Mitigation*:

        * Deploy NATS in **clustered mode with JetStream** (persistence + replay).
        * Enable **ack-based fanout** for critical messages.
        * Monitor replication lag and set alerts.

* **HAProxy Overload**

    * *Risk*: Load balancers may become a bottleneck under sudden traffic spikes.
    * *Mitigation*:

        * Use **multiple HAProxy instances** with DNS/GSLB distribution.
        * Enable autoscaling on CPU/memory thresholds.
        * Apply rate limiting/DDoS protection at the LB layer.

---

### 12.2 Application-Level Risks

* **ListenKey Abuse**

    * *Risk*: Attackers may generate or brute-force listenKeys, leading to unauthorized access.
    * *Mitigation*:

        * Generate listenKeys using **cryptographically strong random values**.
        * Enforce short TTL (e.g., 60m) with refresh required.
        * Bind listenKeys to **userId + IP/device fingerprint**.
        * Rate-limit API endpoints (`POST /listenKey`, `PUT /listenKey`).

* **Config Corruption / Version Skew**

    * *Risk*: Incorrect or conflicting config updates can cause routing errors or dropped messages.
    * *Mitigation*:

        * Apply **schema + version validation** before accepting updates.
        * Use **transactional updates** with Redis WATCH/MULTI/EXEC.
        * Maintain config audit logs for rollback.

* **Unbounded Fanout / Backpressure**

    * *Risk*: Sudden spikes in subscription counts or large depth updates can overload WS nodes.
    * *Mitigation*:

        * Apply **per-topic and per-connection rate limits**.
        * Use message **coalescing/delta compression** for order books.
        * Drop non-critical updates under backpressure.

---

### 12.3 Security Risks

* **Unauthorized Access**

    * *Risk*: Clients may bypass authentication or hijack valid sessions.
    * *Mitigation*:

        * Enforce **TLS everywhere**.
        * Validate all requests with **API key / listenKey authentication**.
        * Implement **WebSocket close codes** for unauthorized access attempts.

* **DDoS Attacks**

    * *Risk*: Massive connection floods or malformed payloads overwhelm servers.
    * *Mitigation*:

        * Apply **connection rate limiting** at HAProxy + WebSocket layer.
        * Implement **per-IP throttling + IP reputation blocking**.
        * Deploy **WAF/CDN (e.g., Cloudflare)** for edge mitigation.

## 13. Appendix

Updating...