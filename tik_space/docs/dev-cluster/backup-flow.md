# Backup Flow

## Overview

Backup strategy for on-premise microk8s cluster running on Ubuntu Server 24 with LVM.
All PVs use `local` volumes on node1, so backup focuses on 2 layers:

1. **Application-level** - pg_dump for PostgreSQL/TimescaleDB
2. **Infrastructure-level** - LVM snapshot for the entire filesystem

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKUP FLOW                              │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  CronJob     │    │  CronJob     │    │  Cron (host)      │  │
│  │  db-backup   │    │  tsdb-backup │    │  lvm-snapshot     │  │
│  │  Daily 2AM   │    │  Daily 2AM   │    │  Weekly Sun 3AM   │  │
│  └──────┬───────┘    └──────┬───────┘    └─────────┬─────────┘  │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  pg_dump     │    │  pg_dump     │    │  lvcreate         │  │
│  │  --format=c  │    │  --format=c  │    │  --snapshot       │  │
│  │  + gzip      │    │  + gzip      │    │  5G               │  │
│  └──────┬───────┘    └──────┬───────┘    └─────────┬─────────┘  │
│         │                   │                      │            │
│         ▼                   ▼                      ▼            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              /mnt/backup/ (on node1)                        ││
│  │                                                             ││
│  │  postgres/                                                  ││
│  │    ├── postgres-20260214-020000.dump.gz                     ││
│  │    ├── fnb-admin-20260214-020000.dump.gz                    ││
│  │    ├── room_manager-20260214-020000.dump.gz                 ││
│  │    └── keycloak-20260214-020000.dump.gz                     ││
│  │  timescaledb/                                               ││
│  │    └── timescaledb-20260214-020000.dump.gz                  ││
│  │  lvm-snapshots/                                             ││
│  │    └── ubuntu-lv-snap-20260209.img.gz                       ││
│  └─────────────────────────────────────────────────────────────┘│
│         │                                                       │
│         ▼  (optional - rsync/rclone to external)                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  External Storage (NAS / S3 / remote server via VPN)        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Stateful Services to Backup

| Service       | Namespace | Data Path (node)             | Databases                                   | Priority     |
|---------------|-----------|------------------------------|---------------------------------------------|--------------|
| PostgreSQL 16 | database  | `/mnt/data/postgres`         | postgres, fnb-admin, room_manager, keycloak | **Critical** |
| TimescaleDB   | database  | `/home/tik/data/timescaledb` | timescaledb                                 | **Critical** |
| MongoDB       | database  | -                            | -                                           | Medium       |
| Redis         | database  | - (in-memory)                | -                                           | Low (cache)  |

> Redis is primarily used as cache, no backup needed. MongoDB backup follows a similar flow to pg_dump but uses
`mongodump`.

## Layer 1: Database Backup (CronJob)

### Prepare on node

```bash
# Create backup directories
sudo mkdir -p /mnt/backup/{postgres,timescaledb,mongodb,scripts}
sudo chown -R 1000:1000 /mnt/backup

# PV for backup storage
```

### Create PV for backup

```yaml
# backup-pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: backup-pv
  labels:
    type: backup
spec:
  capacity:
    storage: 50Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  local:
    path: /mnt/backup
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - node1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
  namespace: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  selector:
    matchLabels:
      type: backup
```

### PostgreSQL Backup CronJob

```yaml
# postgres-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: database
spec:
  schedule: "0 2 * * *"  # Daily at 2AM
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          nodeSelector:
            kubernetes.io/hostname: node1
          containers:
            - name: pg-backup
              image: postgres:16
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: database-secret
                      key: password
              command:
                - /bin/bash
                - -c
                - |
                  set -euo pipefail
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  BACKUP_DIR=/backup/postgres
                  RETENTION_DAYS=7
                  PG_HOST=postgres-postgresql.database.svc.cluster.local

                  DATABASES="postgres fnb-admin room_manager keycloak"

                  for DB in $DATABASES; do
                    echo "[$(date)] Backing up $DB..."
                    pg_dump -h $PG_HOST -U postgres -Fc $DB | \
                      gzip > "$BACKUP_DIR/${DB}-${TIMESTAMP}.dump.gz"
                    echo "[$(date)] Done: ${DB}-${TIMESTAMP}.dump.gz ($(du -h "$BACKUP_DIR/${DB}-${TIMESTAMP}.dump.gz" | cut -f1))"
                  done

                  # Cleanup old backups
                  echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
                  find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

                  echo "[$(date)] Backup completed."
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

### TimescaleDB Backup CronJob

```yaml
# timescaledb-backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: timescaledb-backup
  namespace: database
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          nodeSelector:
            kubernetes.io/hostname: node1
          containers:
            - name: tsdb-backup
              image: timescale/timescaledb:2.24.0-pg17
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: database-secret
                      key: password
              command:
                - /bin/bash
                - -c
                - |
                  set -euo pipefail
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  BACKUP_DIR=/backup/timescaledb
                  RETENTION_DAYS=7
                  TSDB_HOST=timescaledb.database.svc.cluster.local

                  echo "[$(date)] Backing up TimescaleDB..."
                  pg_dump -h $TSDB_HOST -U postgres -Fc timescaledb | \
                    gzip > "$BACKUP_DIR/timescaledb-${TIMESTAMP}.dump.gz"
                  echo "[$(date)] Done: timescaledb-${TIMESTAMP}.dump.gz"

                  # Cleanup
                  find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
                  echo "[$(date)] Backup completed."
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: backup-pvc
          restartPolicy: OnFailure
```

## Layer 2: LVM Snapshot (Host-level)

LVM snapshot captures the entire filesystem at a point in time, including all PV data directories.

### Backup script on host

```bash
#!/bin/bash
# /mnt/backup/scripts/lvm-snapshot-backup.sh
set -euo pipefail

VG="ubuntu-vg"
LV="ubuntu-lv"
SNAP_SIZE="5G"
BACKUP_DIR="/mnt/backup/lvm-snapshots"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d)
SNAP_NAME="${LV}-snap-${TIMESTAMP}"

echo "[$(date)] === LVM Snapshot Backup ==="

# Check free space in VG
FREE_SPACE=$(vgs --noheadings -o vg_free --units g $VG | tr -d ' ')
echo "VG free space: $FREE_SPACE"

# Remove old snapshot if one with the same name exists
if lvs /dev/$VG/$SNAP_NAME &>/dev/null; then
  echo "Removing existing snapshot: $SNAP_NAME"
  lvremove -f /dev/$VG/$SNAP_NAME
fi

# Create snapshot
echo "Creating snapshot: $SNAP_NAME ($SNAP_SIZE)"
lvcreate --size $SNAP_SIZE --snapshot --name $SNAP_NAME /dev/$VG/$LV

# Mount and dump snapshot (optional - if you want to save to file)
MOUNT_DIR="/tmp/snap-mount-${TIMESTAMP}"
mkdir -p $MOUNT_DIR
mount -o ro /dev/$VG/$SNAP_NAME $MOUNT_DIR

echo "Archiving snapshot data..."
tar czf "$BACKUP_DIR/${SNAP_NAME}.tar.gz" \
  -C $MOUNT_DIR \
  mnt/data/postgres \
  home/tik/data/timescaledb \
  2>/dev/null || true

umount $MOUNT_DIR
rmdir $MOUNT_DIR

# Remove snapshot after archiving
lvremove -f /dev/$VG/$SNAP_NAME

# Cleanup old archives
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] === Snapshot backup completed ==="
echo "Archive: $BACKUP_DIR/${SNAP_NAME}.tar.gz ($(du -h "$BACKUP_DIR/${SNAP_NAME}.tar.gz" | cut -f1))"
```

### Setup cron on host

```bash
# Grant execute permission
sudo chmod +x /mnt/backup/scripts/lvm-snapshot-backup.sh

# Add to root crontab
sudo crontab -e
```

```cron
# LVM snapshot backup - Weekly Sunday 3AM
0 3 * * 0 /mnt/backup/scripts/lvm-snapshot-backup.sh >> /var/log/lvm-backup.log 2>&1
```

## Restore Procedures

### Restore PostgreSQL database

```bash
# List available backups
ls -la /mnt/backup/postgres/

# Restore specific database
BACKUP_FILE="fnb-admin-20260214-020000.dump.gz"
DB_NAME="fnb-admin"

# Option 1: Restore from node (fastest)
gunzip -c /mnt/backup/postgres/$BACKUP_FILE | \
  kubectl exec -i -n database deployment/postgres -- \
  pg_restore -U postgres -d $DB_NAME --clean --if-exists

# Option 2: Restore with database recreation
kubectl exec -n database deployment/postgres -- \
  psql -U postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
kubectl exec -n database deployment/postgres -- \
  psql -U postgres -c "CREATE DATABASE \"$DB_NAME\";"
gunzip -c /mnt/backup/postgres/$BACKUP_FILE | \
  kubectl exec -i -n database deployment/postgres -- \
  pg_restore -U postgres -d $DB_NAME
```

### Restore TimescaleDB

```bash
BACKUP_FILE="timescaledb-20260214-020000.dump.gz"

# Pre-restore: ensure timescaledb extension
kubectl exec -n database deployment/timescaledb -- \
  psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

gunzip -c /mnt/backup/timescaledb/$BACKUP_FILE | \
  kubectl exec -i -n database deployment/timescaledb -- \
  pg_restore -U postgres -d timescaledb --clean --if-exists
```

### Restore from LVM snapshot

```bash
# Only use for full node disaster recovery

# 1. Stop workloads
kubectl scale deployment --all -n database --replicas=0

# 2. Extract backup
ARCHIVE="ubuntu-lv-snap-20260209.tar.gz"
sudo tar xzf /mnt/backup/lvm-snapshots/$ARCHIVE -C /

# 3. Restart workloads
kubectl scale deployment --all -n database --replicas=1

# 4. Verify
kubectl get pods -n database
kubectl exec -n database deployment/postgres -- psql -U postgres -c "SELECT datname FROM pg_database;"
```

## Verify Backup

### Manual verification (should run monthly)

```bash
# Check backup file integrity
BACKUP_FILE="/mnt/backup/postgres/postgres-20260214-020000.dump.gz"

# Test gunzip
gunzip -t $BACKUP_FILE && echo "OK: File integrity check passed"

# Test pg_restore dry-run (list contents)
gunzip -c $BACKUP_FILE | pg_restore -l | head -20
```

### Trigger manual backup

```bash
# Run PostgreSQL backup immediately
kubectl create job --from=cronjob/postgres-backup manual-pg-backup-$(date +%s) -n database

# Run TimescaleDB backup
kubectl create job --from=cronjob/timescaledb-backup manual-tsdb-backup-$(date +%s) -n database

# Check job status
kubectl get jobs -n database
kubectl logs job/manual-pg-backup-<id> -n database
```

## Backup Schedule Summary

| What                 | Method         | Schedule       | Retention | Location                     |
|----------------------|----------------|----------------|-----------|------------------------------|
| PostgreSQL (all DBs) | pg_dump + gzip | Daily 2AM      | 7 days    | `/mnt/backup/postgres/`      |
| TimescaleDB          | pg_dump + gzip | Daily 2AM      | 7 days    | `/mnt/backup/timescaledb/`   |
| LVM Snapshot (full)  | lvcreate + tar | Weekly Sun 3AM | 30 days   | `/mnt/backup/lvm-snapshots/` |

## Off-site Backup (Optional)

To push backups to external storage in case the node is lost:

```bash
# Rsync to remote server via VPN
rsync -avz /mnt/backup/ user@remote-server:/backup/dev-cluster/

# Or use rclone to S3-compatible storage
rclone sync /mnt/backup/ s3:dev-cluster-backup/
```

Add to crontab after backup completes:

```cron
# Sync backups to remote - Daily 4AM (after DB backup finishes)
0 4 * * * rsync -avz /mnt/backup/ user@remote-server:/backup/dev-cluster/ >> /var/log/backup-sync.log 2>&1
```
