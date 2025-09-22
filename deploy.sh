#!/bin/bash

# VendorFlow Production Deployment Script
set -e

echo "🚀 Starting VendorFlow Production Deployment..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    print_error ".env.prod file not found!"
    echo "Please create .env.prod from env.prod.example"
    echo "cp env.prod.example .env.prod"
    echo "Then edit .env.prod with your production values"
    exit 1
fi

print_status "Production environment file found"

# Show key configuration (without sensitive data)
echo "🔧 Environment Configuration:"
echo "   NODE_ENV: $(grep '^NODE_ENV=' .env.prod | cut -d'=' -f2)"
echo "   Database: $(grep '^MONGODB_URI=' .env.prod | cut -d'=' -f1)=***configured***"
echo "   Stripe Keys: $(grep '^STRIPE_SECRET_KEY=' .env.prod | cut -d'=' -f1)=***configured***"
echo "   JWT Secret: $(grep '^JWT_SECRET=' .env.prod | cut -d'=' -f1)=***configured***"
echo ""

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Remove old images (optional)
read -p "Do you want to remove old images for fresh build? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old images..."
    docker image prune -f
    docker-compose -f docker-compose.prod.yml build --no-cache
else
    print_status "Building containers..."
    docker-compose -f docker-compose.prod.yml build
fi

# Start containers
print_status "Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 30

# Check container status
print_status "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Health check
print_status "Running health checks..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend health check failed after 30 attempts"
        exit 1
    fi
    sleep 2
done

for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend health check failed after 30 attempts"
        exit 1
    fi
    sleep 2
done

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Your application is running at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   ML Service: http://localhost:8000"
echo ""
echo "📊 Monitor with: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop with: docker-compose -f docker-compose.prod.yml down" 