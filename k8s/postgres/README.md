# PostgreSQL in Kubernetes for FreeResend

This setup deploys PostgreSQL inside your Kubernetes cluster alongside the FreeResend application.

## Benefits

- **No connection limits**: Full control over PostgreSQL configuration
- **Lower latency**: Database runs in the same cluster as the app
- **Cost savings**: No external database service fees
- **Data sovereignty**: Complete control over your data

## Architecture

```
┌─────────────────────────────────────┐
│    Kubernetes Cluster (freeresend) │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  FreeResend  │  │  PostgreSQL │ │
│  │  App (x2)    │──│  StatefulSet│ │
│  │              │  │             │ │
│  └──────────────┘  └─────────────┘ │
│         │                  │        │
│    ┌────────┐      ┌──────────┐    │
│    │Service │      │ PVC (10Gi)│   │
│    └────────┘      └──────────┘    │
└─────────────────────────────────────┘
```

## Files Overview

1. **01-namespace.yaml** - Creates `freeresend` namespace
2. **02-secrets.yaml** - Database credentials and app secrets
3. **03-pvc.yaml** - 10Gi persistent storage for database
4. **04-statefulset.yaml** - PostgreSQL 16 deployment
5. **05-service.yaml** - Internal cluster service
6. **06-configmap.yaml** - Database schema initialization

## Deployment Steps

### 1. Update Secrets (IMPORTANT!)

Edit `02-secrets.yaml` and update:
- `POSTGRES_PASSWORD` - Choose a secure password
- `DATABASE_URL` - Update with your chosen password
- AWS credentials
- Other app secrets

### 2. Deploy PostgreSQL

```bash
# Deploy all PostgreSQL resources
kubectl apply -f k8s/postgres/

# Watch deployment
kubectl get pods -n freeresend -w

# Check logs
kubectl logs -n freeresend postgres-0 -f
```

### 3. Verify Database

```bash
# Connect to PostgreSQL pod
kubectl exec -it -n freeresend postgres-0 -- psql -U freeresend -d freeresend

# Inside psql, check tables:
\dt

# Exit
\q
```

### 4. Update App Deployment

The app deployment in `/k8s/secret.yaml` has already been updated to use:
```
postgresql://freeresend:PASSWORD@postgres-service.freeresend.svc.cluster.local:5432/freeresend
```

### 5. Deploy/Redeploy App

```bash
# Update secrets
kubectl apply -f k8s/secret.yaml

# Restart app to pick up new DATABASE_URL
kubectl rollout restart deployment/freeresend -n freeresend

# Watch rollout
kubectl rollout status deployment/freeresend -n freeresend
```

## Database Management

### Backup

```bash
# Create backup
kubectl exec -n freeresend postgres-0 -- \
  pg_dump -U freeresend freeresend > backup-$(date +%Y%m%d).sql

# Verify backup
ls -lh backup-*.sql
```

### Restore

```bash
# Restore from backup
kubectl exec -i -n freeresend postgres-0 -- \
  psql -U freeresend -d freeresend < backup-20250101.sql
```

### Access Database

```bash
# Port forward to access locally
kubectl port-forward -n freeresend svc/postgres-service 5432:5432

# Connect with local psql
psql postgresql://freeresend:PASSWORD@localhost:5432/freeresend
```

### Scale Storage (if needed)

To increase storage from 10Gi:

1. Edit the PVC:
   ```bash
   kubectl edit pvc postgres-pvc -n freeresend
   ```

2. Update the `spec.resources.requests.storage` value

3. The volume will expand automatically (if your storage class supports it)

## Monitoring

### Check Database Status

```bash
# Pod status
kubectl get statefulset -n freeresend postgres

# Pod details
kubectl describe pod -n freeresend postgres-0

# Database logs
kubectl logs -n freeresend postgres-0 --tail=50
```

### Check Connections

```bash
kubectl exec -n freeresend postgres-0 -- \
  psql -U freeresend -d freeresend -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname='freeresend';"
```

### Check Storage Usage

```bash
kubectl exec -n freeresend postgres-0 -- \
  df -h /var/lib/postgresql/data
```

## Troubleshooting

### Pod Won't Start

```bash
# Check events
kubectl describe pod -n freeresend postgres-0

# Check PVC binding
kubectl get pvc -n freeresend
```

### Connection Refused

```bash
# Verify service
kubectl get svc -n freeresend postgres-service

# Test connection from app pod
kubectl exec -n freeresend deployment/freeresend -- \
  nc -zv postgres-service.freeresend.svc.cluster.local 5432
```

### Initialization Failed

```bash
# Check init logs
kubectl logs -n freeresend postgres-0 | grep -A 20 "init"

# Manually run init script
kubectl exec -n freeresend postgres-0 -- \
  psql -U freeresend -d freeresend -f /docker-entrypoint-initdb.d/init.sql
```

## Migration from External Database

If migrating from an existing external database:

```bash
# 1. Backup external database
pg_dump YOUR_EXTERNAL_DB > migration-backup.sql

# 2. Deploy new PostgreSQL in K8s (steps above)

# 3. Restore to new database
kubectl exec -i -n freeresend postgres-0 -- \
  psql -U freeresend -d freeresend < migration-backup.sql

# 4. Update app secrets and restart
kubectl apply -f k8s/secret.yaml
kubectl rollout restart deployment/freeresend -n freeresend

# 5. Verify app works with new database
kubectl logs -n freeresend deployment/freeresend

# 6. Once verified, decommission external database
```

## Production Considerations

### High Availability

For production, consider:
- Multiple PostgreSQL replicas with replication
- Use a StatefulSet with 3 replicas
- Implement connection pooling (PgBouncer)
- Regular automated backups

### Performance Tuning

Edit StatefulSet to increase resources:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Backup Strategy

Set up automated backups with CronJob:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: freeresend
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -U freeresend -h postgres-service freeresend > /backup/backup-$(date +\%Y\%m\%d).sql
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
```

## Security

- Change default passwords in `02-secrets.yaml`
- Use Kubernetes secrets encryption at rest
- Restrict network policies if needed
- Regular security updates (use `postgres:16-alpine` for smaller attack surface)

## Cost Comparison

**Before (External DB):**
- DigitalOcean Managed DB: ~$15-30/month

**After (In-cluster):**
- 10Gi block storage: ~$1/month
- Minimal compute overhead (already running cluster)

**Savings:** ~$14-29/month
