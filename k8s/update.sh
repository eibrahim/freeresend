#!/bin/bash

# FreeResend Kubernetes Update Script
# Update deployment with new image

set -e

# Generate timestamp for unique image tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="registry.digitalocean.com/curatedletters/freeresend:${TIMESTAMP}"

echo "🔄 Updating FreeResend deployment..."

# Build and push new image
echo "📦 Building Docker image with tag: ${IMAGE_TAG}"
docker build --platform linux/amd64 -t ${IMAGE_TAG} .
docker tag ${IMAGE_TAG} registry.digitalocean.com/curatedletters/freeresend:latest

echo "🔄 Pushing to Digital Ocean Container Registry..."
docker push ${IMAGE_TAG}
docker push registry.digitalocean.com/curatedletters/freeresend:latest

# Update deployment
echo "🚀 Updating Kubernetes deployment..."
kubectl set image deployment/freeresend freeresend=${IMAGE_TAG} -n freeresend

echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/freeresend -n freeresend --timeout=300s

echo "🔍 Deployment status..."
kubectl get pods -n freeresend

echo "✅ FreeResend update completed!"