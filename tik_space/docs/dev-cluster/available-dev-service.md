# Available Development Services on Tiktuzki Cluster

## ⚠️ Important Notice

**Do not conduct load tests on this cluster**

## 🔗 Cluster Connection Setup

### Prerequisites

1. **Install Tunnelblick**: https://tunnelblick.net/downloads.html
2. **Download below .ovpn file** and connect via Tunnelblick or contract long.tran@f8a.io
3. **Connect to services** using the VPN connection

### Cluster Access Information

| Service             | URL/Host                        | Username      | Password    | Notes                  |
|---------------------|---------------------------------|---------------|-------------|------------------------|
| KubeSphere Console  | https://kubesphere.tiktuzki.com | dev           | P@ssword789 | Main cluster interface |
| Nginx Proxy Manager | https://proxy.tiktuzki.com      | dev@gmail.com | P@ssword789 | Proxy manager          |
| Kubeapp             | https://kubeapp.tiktuzki.com    |               |             |                        |
| VPN IP              | 10.8.0.7                        | -             | -           | Base VPN IP            |

## 📊 Available Services by Namespace

### Kafka Namespace

| Service        | Access                         | Port  |
|----------------|--------------------------------|-------|
| Kafka          | VPN                            | 31442 |
| Kafka UI       | https://kafka-ui.tiktuzki.com/ | -     |
| NATS JetStream | VPN                            | 32308 |
| NATS Monitor   | VPN                            | 32309 |

### DevOps Namespace

| Service    | Access                          | Username | Password    | Port |
|------------|---------------------------------|----------|-------------|------|
| Reposilite | https://reposilite.tiktuzki.com | -        | -           | -    |
| Jenkins    | https://jenkins.tiktuzki.com    | admin    | P@ssword789 | -    |

### Database Namespace

| Service      | Access         | Username | Password    | VPN Port |
|--------------|----------------|----------|-------------|----------|
| PostgreSQL   | VPN (10.8.0.7) | postgres | P@ssword789 | 30687    |
| Redis Master | VPN (10.8.0.7) | -        | -           | 32749    |
| MongoDB      | VPN (10.8.0.7) | root     | P@ssword789 | 31317    |
| Cassandra    | VPN (10.8.0.7) | -        | -           | -        |

## 🔧 Quick Connection Examples

### PostgreSQL Connection

```bash
# Connection details
Host: 10.8.0.7
Port: 30687
Username: postgres
Password: P@ssword789
```

### Redis Connection

```bash
# Connection details
Host: 10.8.0.7
Port: 32749
```

## 📝 Notes

- All VPN connections use the base IP: `10.8.0.7`
- Ensure VPN is connected before accessing services via VPN ports
- Web services are accessible directly via HTTPS URLs
- Database services require VPN connection and specific ports
