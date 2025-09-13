#!/bin/bash

# VendorFlow Production Deployment Script
# This script fixes frontend deployment issues and ensures proper production setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to get EC2 public IP
get_public_ip() {
    # Try to get EC2 public IP
    EC2_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    
    if [ -z "$EC2_IP" ]; then
        # If not on EC2, try to get public IP from external service
        EC2_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "localhost")
    fi
    
    echo $EC2_IP
}

# Function to create production environment file
create_production_env() {
    print_status "Creating production environment file..."
    
    # Get public IP
    PUBLIC_IP=$(get_public_ip)
    print_status "Detected public IP: $PUBLIC_IP"
    
    # Create production .env file
    cat > .env << EOF
# MongoDB Configuration (using existing Atlas connection)
MONGODB_URI=mongodb+srv://fadoyintaiwo01:Pakistan123@cluster0.wkxj1sg.mongodb.net/vendor_management?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=vendorflow-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://redis:6379

# Application URLs - Fixed for production deployment
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP/api
NEXT_PUBLIC_ML_URL=http://$PUBLIC_IP/ml
NEXT_INTERNAL_API_URL=http://backend:3001

# AWS Configuration (optional - configure if needed)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}

# Stripe Configuration (optional - configure if needed)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-}

# Email Configuration (optional - configure if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
SMTP_FROM_NAME=VendorFlow
SMTP_GMAIL_USER=${SMTP_GMAIL_USER:-}
SMTP_GMAIL_PASS=${SMTP_GMAIL_PASS:-}

# Security Configuration
NEXT_PUBLIC_STORAGE_KEY=vendorflow-secure-key-change-in-production
EOF

    print_success "Production environment file created with IP: $PUBLIC_IP"
}

# Function to build and deploy services
deploy_services() {
    print_status "Building and deploying services..."
    
    # Stop any running containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Remove old images to ensure fresh build
    print_status "Removing old images..."
    docker system prune -f
    
    # Build all services
    print_status "Building all services..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait for services to start
    sleep 30
    
    # Check if containers are running
    print_status "Checking container status..."
    docker-compose -f docker-compose.prod.yml ps
    
    # Get public IP for testing
    PUBLIC_IP=$(get_public_ip)
    
    print_success "Deployment verification complete!"
    print_status "Your application should be available at:"
    echo -e "  ${GREEN}Frontend:${NC} http://$PUBLIC_IP"
    echo -e "  ${GREEN}API:${NC} http://$PUBLIC_IP/api"
    echo -e "  ${GREEN}ML Service:${NC} http://$PUBLIC_IP/ml"
    echo -e "  ${GREEN}Health Check:${NC} http://$PUBLIC_IP/health"
}

# Function to show logs
show_logs() {
    print_status "Showing service logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Main deployment function
main() {
    print_status "Starting VendorFlow production deployment..."
    
    # Check prerequisites
    check_docker
    
    # Create production environment
    create_production_env
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    verify_deployment
    
    print_success "Deployment completed successfully!"
    
    # Ask if user wants to see logs
    echo ""
    read -p "Would you like to see the service logs? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 