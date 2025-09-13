#!/bin/bash

# Simple VendorFlow EC2 Deployment
# Copy this entire script and paste it into your EC2 instance

set -e

echo "🚀 Starting VendorFlow EC2 Deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo bash deploy.sh"
    exit 1
fi

# Update system and install dependencies
echo "📦 Installing system dependencies..."
apt update -y
apt install -y curl wget git unzip

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    rm get-docker.sh
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Get project files (you need to modify this part based on how you get your code)
echo "📁 Setting up project..."
PROJECT_DIR="/opt/vendorflow"
mkdir -p $PROJECT_DIR

# If you uploaded files to /home/ubuntu/VendorFlow-Deploy
if [ -d "/home/ubuntu/VendorFlow-Deploy" ]; then
    cp -r /home/ubuntu/VendorFlow-Deploy/* $PROJECT_DIR/
elif [ -d "/home/ubuntu/vendorflow" ]; then
    cp -r /home/ubuntu/vendorflow/* $PROJECT_DIR/
else
    echo "❌ Project files not found. Please upload your VendorFlow project first."
    echo "Use: scp -i your-key.pem -r /path/to/VendorFlow-Deploy ubuntu@your-ec2-ip:/home/ubuntu/"
    exit 1
fi

cd $PROJECT_DIR

# Create environment file
echo "⚙️ Creating environment configuration..."
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

cat > .env << EOF
MONGODB_URI=mongodb://admin:password123@mongodb:27017/vendor_management?authSource=admin
JWT_SECRET=vendorflow-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=production
REDIS_URL=redis://redis:6379
AWS_REGION=us-east-1
NEXT_PUBLIC_API_URL=http://$EC2_IP:3004
NEXT_PUBLIC_ML_URL=http://$EC2_IP:8002
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM_NAME=VendorFlow
EOF

# Create production docker-compose
echo "🐳 Creating Docker configuration..."
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
echo "🔒 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow ssh
    ufw allow 3000/tcp
    ufw allow 3004/tcp
    ufw allow 8002/tcp
fi

# Start Docker service
systemctl start docker
systemctl enable docker

# Build and start services
echo "🏗️ Building and starting services (this will take several minutes)..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait and check status
echo "⏳ Waiting for services to start..."
sleep 60

echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo "🌐 Your application is available at:"
echo "   Frontend: http://$EC2_IP:3000"
echo "   Backend API: http://$EC2_IP:3004"
echo "   ML Service: http://$EC2_IP:8002"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs -f"
echo "   Restart: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml restart"
echo "   Stop: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml down"
echo ""
echo "🚀 Visit http://$EC2_IP:3000 to start using VendorFlow!" 