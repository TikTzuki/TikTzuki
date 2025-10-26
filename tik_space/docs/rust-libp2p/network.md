## libp2p Network Protocols Overview

### Kademlia (kad)

- **Purpose:** Distributed hash table (DHT) for peer discovery and content routing
- **Function:** Finds peers, stores/retrieves data across the network without central servers
- **Use case:** Peer discovery, content addressing, routing in decentralized networks

### GossipSub

- **Purpose:** Publish-subscribe messaging protocol
- **Function:** Efficiently broadcasts messages to groups of interested peers
- **Use case:** Chat systems, blockchain transaction propagation, real-time updates

### mDNS (Multicast DNS)

- **Purpose:** Local network peer discovery
- **Function:** Automatically discovers peers on the same local network (LAN/WiFi)
- **Use case:** Finding nearby peers without internet connectivity

### Relay

- **Purpose:** Connection relaying for NAT traversal
- **Function:** Allows peers behind firewalls/NATs to connect through relay nodes
- **Use case:** Helps peers connect when direct connection fails

### Noise

- **Purpose:** Cryptographic security protocol
- **Function:** Provides encryption, authentication, and forward secrecy for connections
- **Use case:** Securing all peer-to-peer communications

---

#### In your current relay server:

- Using: relay (main service), ping (connection health), identify (peer info exchange), and noise (security)
- You could add: kad for peer discovery, gossipsub for messaging, or mdns for local discovery depending on your needs