#!/bin/bash

# VendorFlow Complete Application Deployment Script
# This script deploys the full-stack VendorFlow application to EC2

set -e  # Exit on any error

# Configuration
EC2_HOST="51.20.189.198"
EC2_USER="ubuntu"
SSH_KEY_PATH="~/.ssh/vendorflow-latest.pem"
REMOTE_DIR="/opt/vendorflow"

echo "🚀 Starting VendorFlow Complete Application Deployment..."

# Function to run commands on EC2
run_remote() {
    ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} "$1"
}

# Function to copy files to EC2
copy_to_ec2() {
    scp -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -r "$1" ${EC2_USER}@${EC2_HOST}:"$2"
}

echo "📋 Step 1: Preparing local Docker images..."

# Save Docker images to transfer
echo "  - Saving frontend image..."
docker save vendorflow-frontend:latest | gzip > vendorflow-frontend.tar.gz

echo "  - Saving backend image..."
docker save vendorflow-deploy-backend:latest | gzip > vendorflow-backend.tar.gz

echo "  - Saving ML service image..."
docker save vendorflow-deploy-ml-service:latest | gzip > vendorflow-ml-service.tar.gz

echo "📤 Step 2: Transferring files to EC2..."

# Copy Docker images
echo "  - Transferring frontend image..."
copy_to_ec2 "vendorflow-frontend.tar.gz" "/tmp/"

echo "  - Transferring backend image..."
copy_to_ec2 "vendorflow-backend.tar.gz" "/tmp/"

echo "  - Transferring ML service image..."
copy_to_ec2 "vendorflow-ml-service.tar.gz" "/tmp/"

# Copy configuration files
echo "  - Transferring docker-compose configuration..."
copy_to_ec2 "docker-compose.prod.yml" "${REMOTE_DIR}/"

echo "  - Transferring environment file..."
copy_to_ec2 ".env" "${REMOTE_DIR}/"

echo "🐳 Step 3: Loading Docker images on EC2..."

run_remote "cd /tmp && docker load < vendorflow-frontend.tar.gz"
run_remote "cd /tmp && docker load < vendorflow-backend.tar.gz"
run_remote "cd /tmp && docker load < vendorflow-ml-service.tar.gz"

echo "🔄 Step 4: Updating docker-compose configuration..."

# Create updated docker-compose with the new frontend image
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # Backend API Service
  backend:
    image: vendorflow-deploy-backend:latest
    container_name: vendorflow-backend
    restart: unless-stopped
    ports:
      - "3004:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - vendorflow-network
    volumes:
      - backend-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Service
  frontend:
    image: vendorflow-frontend:latest
    container_name: vendorflow-frontend
    restart: unless-stopped
    ports:
      - "3001:3005"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://51.20.189.198:3004
      - NEXT_PUBLIC_ML_URL=http://51.20.189.198:8002
    networks:
      - vendorflow-network
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3005/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ML Service
  ml-service:
    image: vendorflow-deploy-ml-service:latest
    container_name: vendorflow-ml-service
    restart: unless-stopped
    ports:
      - "8002:8000"
    environment:
      - PYTHONPATH=/app
      - MONGODB_URI=${MONGODB_URI}
    networks:
      - vendorflow-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: vendorflow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - vendorflow-network
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  vendorflow-network:
    driver: bridge

volumes:
  redis-data:
  backend-logs:
EOF

# Copy the updated docker-compose file
echo "  - Updating docker-compose configuration on EC2..."
copy_to_ec2 "docker-compose.prod.yml" "${REMOTE_DIR}/"

echo "🛑 Step 5: Stopping existing services..."
run_remote "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml down --remove-orphans || true"

echo "🧹 Step 6: Cleaning up old containers and images..."
run_remote "docker container prune -f || true"
run_remote "docker image prune -f || true"

echo "🚀 Step 7: Starting complete VendorFlow application..."
run_remote "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml up -d"

echo "⏳ Step 8: Waiting for services to start..."
sleep 30

echo "🔍 Step 9: Checking service health..."
echo "  - Backend health check..."
run_remote "curl -f http://localhost:3004/health || echo 'Backend not ready yet'"

echo "  - Frontend health check..."
run_remote "curl -f http://localhost:3001/ || echo 'Frontend not ready yet'"

echo "  - ML Service health check..."
run_remote "curl -f http://localhost:8002/health || echo 'ML Service not ready yet'"

echo "📊 Step 10: Service status..."
run_remote "cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.yml ps"

echo "🧹 Step 11: Cleaning up local files..."
rm -f vendorflow-frontend.tar.gz vendorflow-backend.tar.gz vendorflow-ml-service.tar.gz

echo ""
echo "🎉 VendorFlow Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend:    http://51.20.189.198:3001"
echo "🔧 Backend API: http://51.20.189.198:3004"
echo "🤖 ML Service:  http://51.20.189.198:8002"
echo "📚 API Docs:    http://51.20.189.198:3004/api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: ssh -i ~/.ssh/vendorflow-latest.pem ubuntu@51.20.189.198 'cd /opt/vendorflow && docker-compose -f docker-compose.prod.yml logs -f'"
echo "  - Restart:   ssh -i ~/.ssh/vendorflow-latest.pem ubuntu@51.20.189.198 'cd /opt/vendorflow && docker-compose -f docker-compose.prod.yml restart'"
echo "  - Status:    ssh -i ~/.ssh/vendorflow-latest.pem ubuntu@51.20.189.198 'cd /opt/vendorflow && docker-compose -f docker-compose.prod.yml ps'"
echo "" 