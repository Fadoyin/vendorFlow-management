#!/bin/bash

# Quick VendorFlow EC2 Deployment Script
# Run this script on your EC2 instance to deploy VendorFlow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 VendorFlow Quick EC2 Deployment${NC}"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo ./quick-ec2-deploy.sh${NC}"
    exit 1
fi

# Get the actual user
ACTUAL_USER=${SUDO_USER:-$USER}
echo -e "${BLUE}Deploying for user: $ACTUAL_USER${NC}"

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update -y && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# Install Docker
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $ACTUAL_USER
    rm get-docker.sh
fi

# Install Docker Compose
echo -e "${BLUE}📦 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js
echo -e "${BLUE}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Setup project directory
PROJECT_DIR="/opt/vendorflow"
echo -e "${BLUE}📁 Setting up project directory: $PROJECT_DIR${NC}"
mkdir -p $PROJECT_DIR

# Copy current directory to project directory if different
if [ "$(pwd)" != "$PROJECT_DIR" ]; then
    echo -e "${BLUE}📋 Copying project files...${NC}"
    cp -r . $PROJECT_DIR/
fi

cd $PROJECT_DIR
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR

# Create environment file
echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"
cat > .env << 'EOF'
# MongoDB Configuration (using local MongoDB)
MONGODB_URI=mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin

# JWT Configuration
JWT_SECRET=vendorflow-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://redis:6379

# AWS Configuration (optional - add your keys if needed)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Stripe Configuration (optional - add your keys if needed)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email Configuration (optional - configure if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=VendorFlow
EOF

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo -e "${BLUE}🌐 Detected IP: $EC2_IP${NC}"

# Update environment with IP
cat >> .env << EOF

# Application URLs
NEXT_PUBLIC_API_URL=http://$EC2_IP:3004
NEXT_PUBLIC_ML_URL=http://$EC2_IP:8002
EOF

# Create production Docker Compose
echo -e "${BLUE}🐳 Creating production Docker Compose configuration...${NC}"
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: vendorflow-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: vendor_management
    volumes:
      - mongodb_data:/data/db
    networks:
      - vendorflow-network

  redis:
    image: redis:7-alpine
    container_name: vendorflow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - vendorflow-network

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: vendorflow-backend
    restart: unless-stopped
    ports:
      - "3004:3001"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: 3001
    depends_on:
      - mongodb
      - redis
    networks:
      - vendorflow-network

  ml-service:
    build:
      context: ./apps/ml-service
      dockerfile: Dockerfile
    container_name: vendorflow-ml
    restart: unless-stopped
    ports:
      - "8002:8000"
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    networks:
      - vendorflow-network

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: vendorflow-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
    depends_on:
      - backend
    networks:
      - vendorflow-network

volumes:
  mongodb_data:
  redis_data:

networks:
  vendorflow-network:
    driver: bridge
EOF

# Setup firewall
echo -e "${BLUE}🔒 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 3004/tcp
    ufw allow 8002/tcp
fi

# Build and start services
echo -e "${BLUE}🏗️  Building and starting services (this may take a few minutes)...${NC}"
systemctl start docker
systemctl enable docker

# Build services
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Create auto-start service
echo -e "${BLUE}⚡ Setting up auto-start service...${NC}"
cat > /etc/systemd/system/vendorflow.service << EOF
[Unit]
Description=VendorFlow Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vendorflow.service

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 60

# Health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check if services are running
if docker ps | grep -q vendorflow-backend; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
fi

if docker ps | grep -q vendorflow-frontend; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
fi

if docker ps | grep -q vendorflow-ml; then
    echo -e "${GREEN}✅ ML Service is running${NC}"
else
    echo -e "${RED}❌ ML Service failed to start${NC}"
fi

# Display results
echo ""
echo -e "${GREEN}🎉 VendorFlow deployment completed!${NC}"
echo "=================================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$EC2_IP:3000"
echo "   Backend API: http://$EC2_IP:3004"
echo "   ML Service: http://$EC2_IP:8002"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs -f"
echo "   Restart: sudo systemctl restart vendorflow"
echo "   Stop: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml down"
echo "   Update: cd $PROJECT_DIR && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "📝 Next Steps:"
echo "   1. Visit http://$EC2_IP:3000 to access your application"
echo "   2. Create your admin user account"
echo "   3. Configure SSL certificate for production"
echo "   4. Set up monitoring and backups"
echo ""
echo -e "${GREEN}🚀 Happy deploying!${NC}" 