#!/bin/bash

# 🚀 VendorFlow Quick Deploy Script
# This script sets up and runs VendorFlow on any Docker-enabled computer

echo "🚀 VendorFlow Quick Deploy Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Check if .env file exists
print_info "Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_status "Created .env file from example"
        print_warning "Please edit .env file with your configurations before continuing"
        print_info "At minimum, change the JWT_SECRET value"
        echo ""
        echo "Press Enter after editing .env file to continue..."
        read
    else
        print_error "env.example file not found. Cannot create .env file."
        exit 1
    fi
else
    print_status ".env file found"
fi

# Stop any existing containers
print_info "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Pull/build images
print_info "Building Docker images (this may take a few minutes)..."
if docker-compose build; then
    print_status "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Start services
print_info "Starting VendorFlow services..."
if docker-compose up -d; then
    print_status "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 30

# Check service status
print_info "Checking service status..."
if docker-compose ps | grep -q "Up"; then
    print_status "Services are running"
else
    print_error "Some services may not be running properly"
    echo "Service status:"
    docker-compose ps
fi

# Test frontend
print_info "Testing frontend connectivity..."
if curl -s -I http://localhost:3005 | grep -q "200 OK"; then
    print_status "Frontend is accessible"
else
    print_warning "Frontend may not be ready yet (this is normal, wait a few more minutes)"
fi

# Display access information
echo ""
echo "🎉 VendorFlow Deployment Complete!"
echo "=================================="
echo ""
echo "📱 Access URLs:"
echo "   Frontend:        http://localhost:3005"
echo "   Backend API:     http://localhost:3004"
echo "   API Docs:        http://localhost:3004/api/docs"
echo "   ML Service:      http://localhost:8002"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart"
echo "   Service status:  docker-compose ps"
echo ""
echo "⏱️  Note: It may take 2-3 minutes for all services to be fully ready"
echo "    If the frontend doesn't load immediately, wait a moment and refresh"
echo ""

# Check if browser command exists
if command -v xdg-open &> /dev/null; then
    echo "🌐 Opening browser..."
    xdg-open http://localhost:3005 &
elif command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    open http://localhost:3005 &
else
    echo "🌐 Open your browser and navigate to: http://localhost:3005"
fi

print_status "Deployment script completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open http://localhost:3005 in your browser"
echo "   2. Login with your credentials"
echo "   3. Explore the dashboard and features"
echo ""
echo "❓ Need help? Check the logs: docker-compose logs -f" 