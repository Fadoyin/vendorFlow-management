#!/bin/bash

# 🐳 VendorFlow Docker Image Package Builder
# This script builds Docker images and creates a deployment package

echo "🐳 VendorFlow Docker Image Package Builder"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
print_info "Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Build all images
print_info "Building VendorFlow Docker images (this may take 10-15 minutes)..."
if docker-compose build; then
    print_status "All images built successfully"
else
    print_error "Failed to build images"
    exit 1
fi

# Get image names
FRONTEND_IMAGE="vendorflow-management-frontend"
BACKEND_IMAGE="vendorflow-management-backend"
ML_IMAGE="vendorflow-management-ml-service"
REDIS_IMAGE="redis:7-alpine"

# Check if images exist
print_info "Verifying built images..."
for image in $FRONTEND_IMAGE $BACKEND_IMAGE $ML_IMAGE $REDIS_IMAGE; do
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$(echo $image | sed 's/:latest//')"; then
        print_status "Found image: $image"
    else
        print_error "Image not found: $image"
        exit 1
    fi
done

# Create deployment directory
PACKAGE_DIR="vendorflow-image-deployment"
print_info "Creating deployment package directory..."
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# Save Docker images
print_info "Saving Docker images to file (this may take 5-10 minutes)..."
IMAGE_FILE="$PACKAGE_DIR/vendorflow-images.tar"

if docker save $FRONTEND_IMAGE $BACKEND_IMAGE $ML_IMAGE $REDIS_IMAGE > $IMAGE_FILE; then
    IMAGE_SIZE=$(du -sh $IMAGE_FILE | cut -f1)
    print_status "Images saved to $IMAGE_FILE (Size: $IMAGE_SIZE)"
else
    print_error "Failed to save images"
    exit 1
fi

# Copy configuration files
print_info "Copying configuration files..."
cp docker-compose.yml $PACKAGE_DIR/ 2>/dev/null || print_warning "docker-compose.yml not found"
cp env.example $PACKAGE_DIR/ 2>/dev/null || print_warning "env.example not found"
cp env.production.example $PACKAGE_DIR/ 2>/dev/null || true
cp quick-deploy.sh $PACKAGE_DIR/ 2>/dev/null || true
cp quick-deploy.bat $PACKAGE_DIR/ 2>/dev/null || true
cp DOCKER_DEPLOYMENT_GUIDE.md $PACKAGE_DIR/ 2>/dev/null || true
cp DOCKER_IMAGE_DEPLOYMENT.md $PACKAGE_DIR/ 2>/dev/null || true

# Create image deployment script
print_info "Creating deployment script..."
cat > $PACKAGE_DIR/deploy-from-images.sh << 'EOF'
#!/bin/bash

# 🐳 VendorFlow Image Deployment Script
echo "🐳 VendorFlow Image Deployment"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check Docker
print_info "Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Load images
print_info "Loading VendorFlow Docker images..."
if [ -f "vendorflow-images.tar" ]; then
    if docker load < vendorflow-images.tar; then
        print_status "Images loaded successfully"
    else
        print_error "Failed to load images"
        exit 1
    fi
else
    print_error "Image file vendorflow-images.tar not found"
    exit 1
fi

# Setup environment
print_info "Setting up environment..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        print_status "Created .env file from example"
        print_warning "Please edit .env file with your configuration"
        print_info "At minimum, change the JWT_SECRET value"
        echo ""
        echo "Press Enter after editing .env file to continue..."
        read
    else
        print_error "env.example not found. Please create .env file manually."
        exit 1
    fi
else
    print_status ".env file already exists"
fi

# Stop any existing containers
print_info "Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Start services
print_info "Starting VendorFlow services..."
if docker-compose up -d; then
    print_status "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait and check status
print_info "Waiting for services to be ready..."
sleep 15

if docker-compose ps | grep -q "Up"; then
    print_status "Services are running"
else
    print_warning "Some services may not be ready yet"
fi

# Test connectivity
print_info "Testing frontend connectivity..."
if curl -s -I http://localhost:3005 | grep -q "200 OK"; then
    print_status "Frontend is accessible"
else
    print_warning "Frontend may not be ready yet (wait a few more minutes)"
fi

echo ""
print_status "VendorFlow deployed successfully from Docker images!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:     http://localhost:3005"
echo "   Backend API:  http://localhost:3004"
echo "   API Docs:     http://localhost:3004/api/docs"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""

# Open browser if possible
if command -v xdg-open &> /dev/null; then
    print_info "Opening browser..."
    xdg-open http://localhost:3005 &
elif command -v open &> /dev/null; then
    print_info "Opening browser..."
    open http://localhost:3005 &
fi

print_status "Deployment complete! 🎉"
EOF

chmod +x $PACKAGE_DIR/deploy-from-images.sh

# Create Windows deployment script
cat > $PACKAGE_DIR/deploy-from-images.bat << 'EOF'
@echo off
echo 🐳 VendorFlow Image Deployment for Windows
echo ==========================================

echo ℹ️  Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ℹ️  Loading VendorFlow Docker images...
if exist vendorflow-images.tar (
    docker load < vendorflow-images.tar
    if %errorlevel% neq 0 (
        echo ❌ Failed to load images
        pause
        exit /b 1
    )
    echo ✅ Images loaded successfully
) else (
    echo ❌ Image file vendorflow-images.tar not found
    pause
    exit /b 1
)

echo ℹ️  Setting up environment...
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul
        echo ✅ Created .env file from example
        echo ⚠️  Please edit .env file with your configuration
        echo Press Enter after editing .env file to continue...
        pause >nul
    ) else (
        echo ❌ env.example not found. Please create .env file manually.
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

echo ℹ️  Starting VendorFlow services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo ✅ Services started successfully
echo.
echo 🎉 VendorFlow deployed successfully from Docker images!
echo.
echo 🌐 Access URLs:
echo    Frontend:     http://localhost:3005
echo    Backend API:  http://localhost:3004
echo    API Docs:     http://localhost:3004/api/docs
echo.
echo 🌐 Opening browser...
start http://localhost:3005

pause
EOF

# Create README for the package
cat > $PACKAGE_DIR/README.txt << 'EOF'
🐳 VendorFlow Docker Image Deployment Package
============================================

This package contains pre-built Docker images for VendorFlow.

QUICK START:
1. Ensure Docker is installed and running
2. Run deployment script:
   - Linux/Mac: ./deploy-from-images.sh
   - Windows:   deploy-from-images.bat
3. Access at: http://localhost:3005

FILES INCLUDED:
- vendorflow-images.tar      (Docker images - ~2-3GB)
- docker-compose.yml         (Service orchestration)
- env.example               (Environment template)
- deploy-from-images.sh     (Linux/Mac deployment)
- deploy-from-images.bat    (Windows deployment)
- Documentation files

MANUAL DEPLOYMENT:
1. docker load < vendorflow-images.tar
2. cp env.example .env
3. Edit .env file (change JWT_SECRET)
4. docker-compose up -d

REQUIREMENTS:
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ storage

For help: Check the documentation files or run:
docker-compose logs -f
EOF

# Create compressed archive
print_info "Creating compressed deployment package..."
ARCHIVE_NAME="vendorflow-image-deployment.tar.gz"
if tar -czf $ARCHIVE_NAME $PACKAGE_DIR/; then
    ARCHIVE_SIZE=$(du -sh $ARCHIVE_NAME | cut -f1)
    print_status "Deployment package created: $ARCHIVE_NAME (Size: $ARCHIVE_SIZE)"
else
    print_error "Failed to create archive"
    exit 1
fi

# Summary
echo ""
print_status "🎉 Docker Image Package Build Complete!"
echo ""
echo "📦 Package Details:"
echo "   Archive:     $ARCHIVE_NAME"
echo "   Size:        $ARCHIVE_SIZE"
echo "   Contains:    Pre-built Docker images + deployment scripts"
echo ""
echo "🚀 To deploy on another computer:"
echo "   1. Copy $ARCHIVE_NAME to target computer"
echo "   2. Extract: tar -xzf $ARCHIVE_NAME"
echo "   3. Deploy:  cd $PACKAGE_DIR && ./deploy-from-images.sh"
echo ""
echo "✅ Advantages of this method:"
echo "   • No build time on target computer (instant deployment)"
echo "   • Works without internet on target computer"
echo "   • Consistent, tested images"
echo "   • Perfect for production deployments"
echo ""
print_status "Ready for fast deployment anywhere! 🚀" 