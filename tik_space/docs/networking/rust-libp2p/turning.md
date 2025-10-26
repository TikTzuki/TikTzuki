## Yamux and RequestResponse Streams in `libp2p`

### 🔍 Overview

**Yamux** (Yet Another Multiplexer) is a multiplexing protocol used in `libp2p` to support multiple **logical streams** over a single **physical connection** (e.g., TCP, QUIC). Each of these streams
enables different protocols or concurrent operations to run in parallel without opening new transport-level connections.

---

### 🔗 Relationship Between Yamux and RequestResponse

* **Yamux Streams**
  Yamux creates lightweight, bidirectional channels on top of a transport connection. Each `libp2p` protocol (e.g., `Identify`, `Kademlia`, `RequestResponse`) communicates using these streams.

* **RequestResponse Streams**
  The `RequestResponse` protocol uses Yamux to open a new stream for each request/response pair. This enables multiple request/response operations to run concurrently without blocking each other.

---

### ⚙️ Key Configuration Parameters

* **`YamuxConfig.max_num_streams`**
  Sets the **maximum total number of Yamux streams** that can be open concurrently on a connection. This limit applies **across all protocols** using that connection.

* **`RequestResponseConfig.max_concurrent_streams`**
  Defines how many **concurrent request/response operations** are allowed specifically for the `RequestResponse` protocol. Each operation requires its own Yamux stream.

---

### ⚠️ Common Pitfall: Stream Exhaustion

If you set:

```text
RequestResponse.max_concurrent_streams > YamuxConfig.max_num_streams
```

…then the connection may **fail to open new streams** when other protocols are already using some of the available Yamux streams. This results in:

> `Error: maximum number of streams reached`

This issue often occurs when `RequestResponse` competes for stream slots with `Identify`, `Ping`, `Kademlia`, and other background protocols.

---

### ✅ Best Practices

1. **Maintain Headroom for Other Protocols**
   Don’t allocate all Yamux streams to `RequestResponse`. Leave a buffer for essential protocols.

2. **Set RequestResponse Limit Accordingly**
   Ensure:

   ```text
   RequestResponse.max_concurrent_streams ≤ YamuxConfig.max_num_streams - expected_other_streams
   ```

3. **Example Calculation**
   If:

    * `YamuxConfig.max_num_streams = 256`
    * You expect:

        * \~20 streams for DHT (Kademlia)
        * \~10 streams for Identify + Ping
          Then:

   ```text
   RequestResponse.max_concurrent_streams = 200 or lower
   ```

---

### 🧠 Additional Notes

* Yamux streams are **bidirectional**, but `RequestResponse` usually opens a **new stream per interaction** to keep exchanges isolated and concurrent.
* Proper stream configuration improves:

    * **Protocol stability**
    * **Throughput under load**
    * **Resilience to runtime stream exhaustion**

---

Let me know if you’d like this translated into Rust config code for `libp2p` initialization.
