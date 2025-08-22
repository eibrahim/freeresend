# FreeResend Kubernetes Deployment

Deploy FreeResend to Digital Ocean Kubernetes cluster with domain www.freeresend.com.

## Prerequisites

- Digital Ocean Kubernetes cluster
- kubectl configured for your cluster
- Docker logged in to Digital Ocean Container Registry
- cert-manager installed for SSL certificates
- nginx-ingress-controller installed
- Domain www.freeresend.com pointing to your cluster

## Quick Deployment

```bash
# Deploy everything
./k8s/deploy.sh
```

## Manual Deployment

```bash
# 1. Build and push Docker image
docker build -t registry.digitalocean.com/curatedletters/freeresend:latest .
docker push registry.digitalocean.com/curatedletters/freeresend:latest

# 2. Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml

# Copy and customize the secret file
cp k8s/secret.template.yaml k8s/secret.yaml
# Edit secret.yaml with your actual values
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# 3. Check deployment status
kubectl get pods -n freeresend
kubectl get ingress -n freeresend
```

## Configuration Files

- `namespace.yaml` - Creates freeresend namespace
- `secret.template.yaml` - Template for environment variables and secrets (copy to secret.yaml)
- `deployment.yaml` - FreeResend application deployment
- `service.yaml` - Internal service for pods
- `ingress.yaml` - HTTPS ingress for www.freeresend.com
- `hpa.yaml` - Horizontal pod autoscaler (2-10 replicas)

## Environment Variables

Update `secret.yaml` with your actual values:

- `NEXTAUTH_URL` - https://www.freeresend.com
- `NEXTAUTH_SECRET` - JWT secret key
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_REGION` - AWS SES region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `DO_API_TOKEN` - Digital Ocean API token
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password

## Updating the Application

```bash
# Update with new image
./k8s/update.sh
```

## Monitoring

```bash
# Check pods
kubectl get pods -n freeresend

# Check logs
kubectl logs -f deployment/freeresend -n freeresend

# Check ingress
kubectl describe ingress freeresend-ingress -n freeresend

# Check HPA status
kubectl get hpa -n freeresend
```

## Scaling

The HPA automatically scales between 2-10 replicas based on CPU and memory usage.

Manual scaling:
```bash
kubectl scale deployment freeresend --replicas=5 -n freeresend
```

## SSL Certificate

The ingress automatically provisions SSL certificates via cert-manager for:
- www.freeresend.com  
- freeresend.com

## Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n freeresend
kubectl logs <pod-name> -n freeresend
```

**SSL certificate issues:**
```bash
kubectl describe certificate freeresend-tls -n freeresend
kubectl describe clusterissuer letsencrypt-prod
```

**Ingress not working:**
```bash
kubectl describe ingress freeresend-ingress -n freeresend
```

## Clean Up

```bash
# Delete all resources
kubectl delete namespace freeresend
```