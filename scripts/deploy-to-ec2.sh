#!/bin/bash

# VendorFlow EC2 Deployment Script
# This script automates the deployment of VendorFlow to an AWS EC2 instance

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vendorflow"
PROJECT_DIR="/opt/vendorflow"
DOCKER_COMPOSE_VERSION="2.24.0"

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
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
        apt-get update -y
        apt-get upgrade -y
        apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    elif [[ "$OS" == *"Amazon Linux"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        yum update -y
        yum install -y curl wget git unzip
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
        return
    fi
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io
        
    elif [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y docker
    else
        print_error "Docker installation not supported for $OS"
        exit 1
    fi
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group if not root
    if [ "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        print_status "Added $SUDO_USER to docker group. Please log out and back in for changes to take effect."
    fi
    
    print_success "Docker installed successfully!"
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is already installed"
        return
    fi
    
    # Download and install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for easier access
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully!"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_warning "Node.js is already installed: $NODE_VERSION"
        return
    fi
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        apt-get install -y nodejs
    elif [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y nodejs npm
    fi
    
    print_success "Node.js installed successfully!"
}

# Function to install Python 3.9
install_python() {
    print_status "Installing Python 3.9..."
    
    if command -v python3.9 &> /dev/null; then
        print_warning "Python 3.9 is already installed"
        return
    fi
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        add-apt-repository ppa:deadsnakes/ppa -y
        apt-get update -y
        apt-get install -y python3.9 python3.9-pip python3.9-venv python3.9-dev
    elif [[ "$OS" == *"Amazon Linux"* ]]; then
        yum install -y python39 python39-pip
    fi
    
    print_success "Python 3.9 installed successfully!"
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian firewall
        ufw --force enable
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3000:3010/tcp  # Application ports
        ufw allow 8000:8010/tcp  # ML service ports
        print_success "UFW firewall configured!"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewall
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=3000-3010/tcp
        firewall-cmd --permanent --add-port=8000-8010/tcp
        firewall-cmd --reload
        print_success "Firewalld configured!"
    else
        print_warning "No firewall management tool found. Please configure manually."
    fi
}

# Function to create project directory
create_project_directory() {
    print_status "Creating project directory..."
    
    mkdir -p $PROJECT_DIR
    chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR 2>/dev/null || true
    
    print_success "Project directory created: $PROJECT_DIR"
}

# Function to collect deployment configuration
collect_configuration() {
    print_status "Collecting deployment configuration..."
    
    echo ""
    echo "=== VendorFlow Deployment Configuration ==="
    echo ""
    
    # MongoDB URI
    echo "Enter your MongoDB connection string:"
    echo "Example: mongodb+srv://username:password@cluster.mongodb.net/vendorflow_prod"
    echo "Or press Enter to use local MongoDB (will be installed)"
    read -p "MongoDB URI (optional): " MONGODB_URI
    
    if [ -z "$MONGODB_URI" ]; then
        MONGODB_URI="mongodb://admin:password123@localhost:27017/vendor_management?authSource=admin"
        USE_LOCAL_MONGODB=true
        print_status "Will use local MongoDB"
    else
        USE_LOCAL_MONGODB=false
        print_status "Will use external MongoDB"
    fi
    
    # JWT Secret
    echo ""
    echo "Enter a secure JWT secret (or press Enter to generate one):"
    read -p "JWT Secret: " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "Generated JWT Secret: $JWT_SECRET"
    fi
    
    # AWS Configuration (optional)
    echo ""
    echo "Enter AWS configuration (optional, press Enter to skip):"
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    read -p "AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    # Stripe Configuration (optional)
    echo ""
    echo "Enter Stripe configuration (optional, press Enter to skip):"
    read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Stripe Publishable Key: " STRIPE_PUBLISHABLE_KEY
    read -p "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
    
    # Domain configuration
    echo ""
    read -p "Enter your domain name (optional): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        # Get EC2 public IP
        DOMAIN_NAME=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
        print_status "Will use IP/localhost: $DOMAIN_NAME"
    fi
    
    print_success "Configuration collected!"
}

# Function to clone or update repository
setup_repository() {
    print_status "Setting up repository..."
    
    echo "Choose repository source:"
    echo "1) Clone from Git repository"
    echo "2) Use current local files"
    read -p "Choice (1-2): " REPO_CHOICE
    
    case $REPO_CHOICE in
        1)
            echo "Enter Git repository URL:"
            read -p "Repository URL: " REPO_URL
            if [ -d "$PROJECT_DIR/.git" ]; then
                cd $PROJECT_DIR
                git pull
            else
                git clone $REPO_URL $PROJECT_DIR
            fi
            ;;
        2)
            print_status "Using current directory files..."
            if [ "$(pwd)" != "$PROJECT_DIR" ]; then
                cp -r . $PROJECT_DIR/
            fi
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    cd $PROJECT_DIR
    print_success "Repository setup complete!"
}

# Function to create environment file
create_environment_file() {
    print_status "Creating environment file..."
    
    cat > $PROJECT_DIR/.env << EOF
# MongoDB Configuration
MONGODB_URI=$MONGODB_URI

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

# Stripe Configuration
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Application URLs
NEXT_PUBLIC_API_URL=http://$DOMAIN_NAME:3004
NEXT_PUBLIC_ML_URL=http://$DOMAIN_NAME:8002

# Email Configuration (Gmail SMTP - configure if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=VendorFlow

# Redis Configuration
REDIS_URL=redis://localhost:6379
EOF
    
    print_success "Environment file created!"
}

# Function to create production Docker Compose file
create_docker_compose() {
    print_status "Creating Docker Compose configuration..."
    
    cat > $PROJECT_DIR/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  # MongoDB (if using local)
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
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - vendorflow-network

  # Redis
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

  # Backend API (NestJS)
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
    volumes:
      - backend_uploads:/app/uploads
    depends_on:
      - redis
    networks:
      - vendorflow-network

  # ML Service (FastAPI)
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
    environment:
      MODEL_PATH: /app/models
    volumes:
      - ml_models:/app/models
    depends_on:
      - redis
    networks:
      - vendorflow-network

  # Frontend (Next.js)
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: vendorflow-frontend
    restart: unless-stopped
    ports:
      - "3005:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
    depends_on:
      - backend
    networks:
      - vendorflow-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: vendorflow-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
      - ml-service
    networks:
      - vendorflow-network

volumes:
  mongodb_data:
  redis_data:
  ml_models:
  backend_uploads:

networks:
  vendorflow-network:
    driver: bridge
EOF
    
    print_success "Docker Compose configuration created!"
}

# Function to create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    mkdir -p $PROJECT_DIR/nginx
    
    cat > $PROJECT_DIR/nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    upstream ml-service {
        server ml-service:8000;
    }
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=ml:10m rate=5r/s;
    
    server {
        listen 80;
        server_name $DOMAIN_NAME;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # ML API routes
        location /ml/ {
            limit_req zone=ml burst=10 nodelay;
            proxy_pass http://ml-service/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
    
    print_success "Nginx configuration created!"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing application dependencies..."
    
    cd $PROJECT_DIR
    
    # Install backend dependencies
    if [ -f "apps/backend/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd apps/backend
        npm install
        cd ../..
    fi
    
    # Install frontend dependencies
    if [ -f "apps/frontend/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd apps/frontend
        npm install
        cd ../..
    fi
    
    # Install ML service dependencies
    if [ -f "apps/ml-service/requirements.txt" ]; then
        print_status "Installing ML service dependencies..."
        cd apps/ml-service
        python3.9 -m pip install -r requirements.txt
        cd ../..
    fi
    
    print_success "Dependencies installed!"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    cd $PROJECT_DIR
    
    # Determine which services to start
    if [ "$USE_LOCAL_MONGODB" = true ]; then
        COMPOSE_SERVICES=""
    else
        COMPOSE_SERVICES="--scale mongodb=0"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d $COMPOSE_SERVICES
    
    print_success "Services deployed!"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check backend health
    for i in {1..5}; do
        if curl -f -s http://localhost/api/health > /dev/null; then
            print_success "Backend health check passed!"
            break
        else
            print_warning "Backend health check attempt $i failed, retrying..."
            sleep 10
        fi
    done
    
    # Check frontend
    for i in {1..5}; do
        if curl -f -s http://localhost > /dev/null; then
            print_success "Frontend health check passed!"
            break
        else
            print_warning "Frontend health check attempt $i failed, retrying..."
            sleep 10
        fi
    done
    
    # Check ML service
    for i in {1..5}; do
        if curl -f -s http://localhost/ml/health > /dev/null; then
            print_success "ML service health check passed!"
            break
        else
            print_warning "ML service health check attempt $i failed, retrying..."
            sleep 10
        fi
    done
    
    print_success "Health checks completed!"
}

# Function to setup system services
setup_system_services() {
    print_status "Setting up system services..."
    
    # Create systemd service for auto-start
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
    
    print_success "System service configured!"
}

# Function to display deployment results
display_results() {
    print_success "🎉 VendorFlow deployment completed successfully!"
    
    echo ""
    echo "=== DEPLOYMENT INFORMATION ==="
    echo "Application URL: http://$DOMAIN_NAME"
    echo "API URL: http://$DOMAIN_NAME/api"
    echo "ML Service URL: http://$DOMAIN_NAME/ml"
    echo "Project Directory: $PROJECT_DIR"
    echo ""
    echo "=== SERVICE PORTS ==="
    echo "Frontend: 3005 (via Nginx: 80)"
    echo "Backend API: 3004 (via Nginx: 80/api)"
    echo "ML Service: 8002 (via Nginx: 80/ml)"
    if [ "$USE_LOCAL_MONGODB" = true ]; then
        echo "MongoDB: 27017"
    fi
    echo "Redis: 6379"
    echo ""
    echo "=== USEFUL COMMANDS ==="
    echo "View logs: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs -f"
    echo "Restart services: sudo systemctl restart vendorflow"
    echo "Stop services: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml down"
    echo "Update services: cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Create your first admin user by visiting: http://$DOMAIN_NAME"
    echo "2. Configure SSL certificate for production use"
    echo "3. Set up monitoring and backups"
    echo "4. Configure your domain DNS if using a custom domain"
    echo ""
    print_success "Happy deploying! 🚀"
}

# Function to cleanup on error
cleanup() {
    print_error "Deployment failed. Check the logs above for details."
    echo ""
    echo "To retry deployment:"
    echo "1. Fix any issues mentioned in the error logs"
    echo "2. Run this script again"
    echo ""
    echo "To clean up partial deployment:"
    echo "docker-compose -f $PROJECT_DIR/docker-compose.prod.yml down"
    echo "docker system prune -f"
}

# Main deployment function
main() {
    echo "🚀 VendorFlow EC2 Deployment Script"
    echo "====================================="
    echo ""
    
    # Trap errors for cleanup
    trap cleanup ERR
    
    # Run deployment steps
    check_root
    detect_os
    update_system
    install_docker
    install_docker_compose
    install_nodejs
    install_python
    setup_firewall
    create_project_directory
    collect_configuration
    setup_repository
    create_environment_file
    create_docker_compose
    create_nginx_config
    install_dependencies
    deploy_services
    run_health_checks
    setup_system_services
    display_results
    
    print_success "🎉 VendorFlow is now running on your EC2 instance!"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 