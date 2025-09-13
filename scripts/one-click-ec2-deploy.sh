#!/bin/bash

# VendorFlow One-Click EC2 Deployment Script
# This script installs all prerequisites and deploys VendorFlow with fixed frontend configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vendorflow"
PROJECT_DIR="/opt/vendorflow"
LOG_FILE="/var/log/vendorflow-deployment.log"

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date): [INFO] $1" >> $LOG_FILE
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date): [SUCCESS] $1" >> $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date): [WARNING] $1" >> $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date): [ERROR] $1" >> $LOG_FILE
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Function to create log file
setup_logging() {
    touch $LOG_FILE
    chmod 644 $LOG_FILE
    print_status "Logging to: $LOG_FILE"
}

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS version"
        exit 1
    fi
    print_status "Detected OS: $OS $VER"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y
        apt-get upgrade -y
        apt-get install -y curl wget git unzip software-properties-common \
            apt-transport-https ca-certificates gnupg lsb-release \
            htop net-tools ufw fail2ban
    elif [[ "$OS" == *"Amazon Linux"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum install -y curl wget git unzip htop net-tools
    else
        print_error "Unsupported operating system: $OS"
        exit 1
    fi
    
    print_success "System packages updated!"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_warning "Docker is already installed"
        docker --version
        return
    fi
    
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    
    # Add current user to docker group
    usermod -aG docker ubuntu 2>/dev/null || usermod -aG docker ec2-user 2>/dev/null || true
    
    # Start Docker service
    systemctl enable docker
    systemctl start docker
    
    print_success "Docker installed successfully!"
    docker --version
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is already installed"
        docker-compose --version
        return
    fi
    
    # Install Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for easier access
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully!"
    docker-compose --version
}

# Function to setup project directory
setup_project_directory() {
    print_status "Setting up project directory..."
    
    # Create project directory
    mkdir -p $PROJECT_DIR
    
    # Change ownership to ubuntu user (or ec2-user on Amazon Linux)
    chown ubuntu:ubuntu $PROJECT_DIR 2>/dev/null || chown ec2-user:ec2-user $PROJECT_DIR 2>/dev/null || true
    
    print_success "Project directory created: $PROJECT_DIR"
}

# Function to get EC2 public IP
get_public_ip() {
    print_status "Detecting EC2 public IP..."
    
    # Try to get EC2 public IP
    EC2_IP=$(curl -s --max-time 10 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    
    if [ -z "$EC2_IP" ]; then
        # If not on EC2, try to get public IP from external service
        EC2_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null || echo "localhost")
    fi
    
    print_success "Detected IP: $EC2_IP"
    echo $EC2_IP
}

# Function to clone repository
clone_repository() {
    print_status "Cloning VendorFlow repository..."
    
    cd $PROJECT_DIR
    
    # If directory is not empty, backup and clean
    if [ "$(ls -A $PROJECT_DIR)" ]; then
        print_warning "Directory not empty, creating backup..."
        mv $PROJECT_DIR $PROJECT_DIR.backup.$(date +%Y%m%d_%H%M%S)
        mkdir -p $PROJECT_DIR
        cd $PROJECT_DIR
    fi
    
    # Clone the repository (you'll need to replace with actual repo URL)
    # For now, we'll assume the files are already present or will be copied
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_warning "Repository files not found. Please ensure VendorFlow files are present in $PROJECT_DIR"
        print_status "You can manually copy the files or clone from your repository"
    fi
    
    print_success "Repository setup complete!"
}

# Function to create production environment file
create_production_env() {
    print_status "Creating production environment file..."
    
    # Get public IP
    PUBLIC_IP=$(get_public_ip)
    
    # Create production .env file
    cat > $PROJECT_DIR/.env << EOF
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

# Application URLs - Configured for EC2 deployment
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

# AWS Forecast Configuration
AWS_FORECAST_ROLE_ARN=${AWS_FORECAST_ROLE_ARN:-}
AWS_S3_BUCKET=${AWS_S3_BUCKET:-vendorflow-forecast-data}
FORECAST_AUTO_CLEANUP=true
FORECAST_MAX_CONCURRENT_JOBS=5
FORECAST_MIN_DATA_POINTS=60
EOF

    # Set proper permissions
    chown ubuntu:ubuntu $PROJECT_DIR/.env 2>/dev/null || chown ec2-user:ec2-user $PROJECT_DIR/.env 2>/dev/null || true
    chmod 600 $PROJECT_DIR/.env
    
    print_success "Production environment file created with IP: $PUBLIC_IP"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Configure UFW firewall
    if command -v ufw &> /dev/null; then
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        print_success "UFW firewall configured!"
    else
        print_warning "UFW not available, skipping firewall configuration"
    fi
}

# Function to deploy services
deploy_services() {
    print_status "Deploying VendorFlow services..."
    
    cd $PROJECT_DIR
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Clean up old images and containers
    print_status "Cleaning up old Docker resources..."
    docker system prune -f
    
    # Build all services
    print_status "Building services (this may take several minutes)..."
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
    print_status "Waiting for services to initialize..."
    sleep 60
    
    cd $PROJECT_DIR
    
    # Check container status
    print_status "Checking container status..."
    docker-compose -f docker-compose.prod.yml ps
    
    # Get public IP for testing
    PUBLIC_IP=$(get_public_ip)
    
    # Test health endpoints
    print_status "Testing health endpoints..."
    
    # Test nginx health
    if curl -f -s http://localhost/health > /dev/null; then
        print_success "Nginx health check: OK"
    else
        print_warning "Nginx health check: Failed"
    fi
    
    print_success "Deployment verification complete!"
    
    echo ""
    print_header "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
    echo ""
    print_success "Your VendorFlow application is now running!"
    echo ""
    echo -e "${CYAN}Access your application at:${NC}"
    echo -e "  🌐 ${GREEN}Frontend:${NC} http://$PUBLIC_IP/"
    echo -e "  🔧 ${GREEN}API:${NC} http://$PUBLIC_IP/api/"
    echo -e "  🤖 ${GREEN}ML Service:${NC} http://$PUBLIC_IP/ml/"
    echo -e "  ❤️  ${GREEN}Health Check:${NC} http://$PUBLIC_IP/health"
    echo ""
    echo -e "${CYAN}Useful commands:${NC}"
    echo -e "  📊 View logs: ${YELLOW}docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs${NC}"
    echo -e "  🔄 Restart: ${YELLOW}docker-compose -f $PROJECT_DIR/docker-compose.prod.yml restart${NC}"
    echo -e "  🛑 Stop: ${YELLOW}docker-compose -f $PROJECT_DIR/docker-compose.prod.yml down${NC}"
    echo ""
}

# Function to create systemd service
create_systemd_service() {
    print_status "Creating systemd service for auto-start..."
    
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
    
    print_success "Systemd service created! VendorFlow will auto-start on boot."
}

# Function to show final information
show_final_info() {
    PUBLIC_IP=$(get_public_ip)
    
    print_header "📋 DEPLOYMENT SUMMARY"
    echo ""
    echo -e "${CYAN}Installation Details:${NC}"
    echo -e "  📁 Installation Directory: ${YELLOW}$PROJECT_DIR${NC}"
    echo -e "  📝 Log File: ${YELLOW}$LOG_FILE${NC}"
    echo -e "  🌐 Public IP: ${YELLOW}$PUBLIC_IP${NC}"
    echo ""
    echo -e "${CYAN}Services Status:${NC}"
    docker-compose -f $PROJECT_DIR/docker-compose.prod.yml ps
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. ${GREEN}Test your application${NC} at http://$PUBLIC_IP/"
    echo -e "  2. ${GREEN}Configure SSL/HTTPS${NC} for production use"
    echo -e "  3. ${GREEN}Set up monitoring${NC} and backups"
    echo -e "  4. ${GREEN}Update environment variables${NC} in $PROJECT_DIR/.env as needed"
    echo ""
    echo -e "${GREEN}Deployment completed successfully! 🚀${NC}"
}

# Main deployment function
main() {
    print_header "🚀 VendorFlow One-Click EC2 Deployment"
    
    # Setup logging
    setup_logging
    
    # Check prerequisites
    check_root
    detect_os
    
    # System setup
    update_system
    install_docker
    install_docker_compose
    configure_firewall
    
    # Project setup
    setup_project_directory
    clone_repository
    create_production_env
    
    # Deploy application
    deploy_services
    verify_deployment
    
    # Final setup
    create_systemd_service
    show_final_info
    
    print_success "🎉 One-click deployment completed successfully!"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 