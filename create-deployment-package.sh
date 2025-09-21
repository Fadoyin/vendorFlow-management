#!/bin/bash

# 📦 VendorFlow Deployment Package Creator
# This script creates a minimal deployment package with only essential files

echo "📦 VendorFlow Deployment Package Creator"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Get package type from user
echo ""
echo "Select deployment package type:"
echo "1. Minimal (Essential files only - ~30MB)"
echo "2. Complete (All files except build artifacts - ~200MB)"
echo "3. Production (Optimized for production deployment - ~50MB)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        PACKAGE_TYPE="minimal"
        PACKAGE_NAME="vendorflow-minimal"
        ;;
    2)
        PACKAGE_TYPE="complete"
        PACKAGE_NAME="vendorflow-complete"
        ;;
    3)
        PACKAGE_TYPE="production"
        PACKAGE_NAME="vendorflow-production"
        ;;
    *)
        echo "Invalid choice. Using minimal package."
        PACKAGE_TYPE="minimal"
        PACKAGE_NAME="vendorflow-minimal"
        ;;
esac

print_info "Creating $PACKAGE_TYPE deployment package..."

# Create temporary directory
TEMP_DIR="./deployment-temp"
PACKAGE_DIR="$TEMP_DIR/$PACKAGE_NAME"

# Clean up any existing temp directory
rm -rf $TEMP_DIR
mkdir -p $PACKAGE_DIR

# Copy essential files for all package types
print_info "Copying essential configuration files..."

# Core configuration files
cp docker-compose.yml $PACKAGE_DIR/ 2>/dev/null || print_warning "docker-compose.yml not found"
cp env.example $PACKAGE_DIR/ 2>/dev/null || print_warning "env.example not found"
cp env.production.example $PACKAGE_DIR/ 2>/dev/null || true
cp package.json $PACKAGE_DIR/ 2>/dev/null || print_warning "package.json not found"
cp turbo.json $PACKAGE_DIR/ 2>/dev/null || true
cp .gitignore $PACKAGE_DIR/ 2>/dev/null || true

# Deployment scripts and documentation
cp quick-deploy.sh $PACKAGE_DIR/ 2>/dev/null || true
cp quick-deploy.bat $PACKAGE_DIR/ 2>/dev/null || true
cp DOCKER_DEPLOYMENT_GUIDE.md $PACKAGE_DIR/ 2>/dev/null || true
cp README_DEPLOYMENT.md $PACKAGE_DIR/ 2>/dev/null || true
cp DEPLOYMENT_FILES_CHECKLIST.md $PACKAGE_DIR/ 2>/dev/null || true

print_status "Essential files copied"

# Copy application code
print_info "Copying application code..."

if [ "$PACKAGE_TYPE" = "minimal" ]; then
    # Minimal: Only essential source files
    print_info "Creating minimal package (source code only)..."
    
    # Frontend essentials
    mkdir -p $PACKAGE_DIR/apps/frontend
    cp -r apps/frontend/src $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp -r apps/frontend/public $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp apps/frontend/package.json $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp apps/frontend/Dockerfile.dev $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp apps/frontend/next.config.js $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp apps/frontend/tailwind.config.js $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    cp apps/frontend/postcss.config.js $PACKAGE_DIR/apps/frontend/ 2>/dev/null || true
    
    # Backend essentials
    mkdir -p $PACKAGE_DIR/apps/backend
    cp -r apps/backend/src $PACKAGE_DIR/apps/backend/ 2>/dev/null || true
    cp apps/backend/package.json $PACKAGE_DIR/apps/backend/ 2>/dev/null || true
    cp apps/backend/Dockerfile.dev $PACKAGE_DIR/apps/backend/ 2>/dev/null || true
    
    # ML Service essentials
    mkdir -p $PACKAGE_DIR/apps/ml-service
    cp -r apps/ml-service/app $PACKAGE_DIR/apps/ml-service/ 2>/dev/null || true
    cp apps/ml-service/main.py $PACKAGE_DIR/apps/ml-service/ 2>/dev/null || true
    cp apps/ml-service/requirements.txt $PACKAGE_DIR/apps/ml-service/ 2>/dev/null || true
    cp apps/ml-service/Dockerfile.dev $PACKAGE_DIR/apps/ml-service/ 2>/dev/null || true
    
    # Shared packages
    cp -r packages $PACKAGE_DIR/ 2>/dev/null || true

elif [ "$PACKAGE_TYPE" = "production" ]; then
    # Production: Essential files + deployment optimizations
    print_info "Creating production package..."
    
    # Copy apps folder but exclude development files
    rsync -av --exclude='node_modules' \
              --exclude='.next' \
              --exclude='dist' \
              --exclude='*.log' \
              --exclude='coverage' \
              apps/ $PACKAGE_DIR/apps/ 2>/dev/null || true
    
    # Copy packages
    cp -r packages $PACKAGE_DIR/ 2>/dev/null || true
    
    # Add production-specific files
    cp env.production.example $PACKAGE_DIR/.env.production 2>/dev/null || true

else
    # Complete: Everything except build artifacts
    print_info "Creating complete package..."
    
    # Copy everything except unwanted files
    rsync -av --exclude='node_modules' \
              --exclude='.next' \
              --exclude='dist' \
              --exclude='.turbo' \
              --exclude='.git' \
              --exclude='*.log' \
              --exclude='coverage' \
              --exclude='deployment-temp' \
              apps/ $PACKAGE_DIR/apps/ 2>/dev/null || true
    
    # Copy packages
    cp -r packages $PACKAGE_DIR/ 2>/dev/null || true
    
    # Copy additional files for complete package
    cp -r docs $PACKAGE_DIR/ 2>/dev/null || true
    cp -r scripts $PACKAGE_DIR/ 2>/dev/null || true
    cp LICENSE $PACKAGE_DIR/ 2>/dev/null || true
    cp README.md $PACKAGE_DIR/ 2>/dev/null || true
fi

print_status "Application code copied"

# Make scripts executable
chmod +x $PACKAGE_DIR/quick-deploy.sh 2>/dev/null || true

# Create deployment instructions
print_info "Creating deployment instructions..."

cat > $PACKAGE_DIR/DEPLOY_README.txt << 'EOF'
🚀 VendorFlow Deployment Package
================================

Quick Start:
1. Copy this entire folder to your target computer
2. Install Docker and Docker Compose
3. Run the deployment script:
   
   Linux/Mac:   ./quick-deploy.sh
   Windows:     quick-deploy.bat
   Manual:      docker-compose up -d

4. Access at: http://localhost:3005

Requirements:
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ storage

For detailed instructions, see DOCKER_DEPLOYMENT_GUIDE.md

Files included in this package:
- Complete application source code
- Docker configuration
- Deployment scripts
- Environment templates
- Documentation

Need help? Check the deployment guide or run:
docker-compose logs -f
EOF

print_status "Deployment instructions created"

# Calculate package size
PACKAGE_SIZE=$(du -sh $PACKAGE_DIR | cut -f1)
print_info "Package size: $PACKAGE_SIZE"

# Create archive
print_info "Creating deployment archive..."

cd $TEMP_DIR
tar -czf "${PACKAGE_NAME}.tar.gz" $PACKAGE_NAME/
cd ..

# Move archive to current directory
mv "$TEMP_DIR/${PACKAGE_NAME}.tar.gz" ./

# Clean up temp directory
rm -rf $TEMP_DIR

ARCHIVE_SIZE=$(du -sh "${PACKAGE_NAME}.tar.gz" | cut -f1)

print_status "Deployment package created successfully!"

echo ""
echo "📦 Package Details:"
echo "   Type: $PACKAGE_TYPE"
echo "   Archive: ${PACKAGE_NAME}.tar.gz"
echo "   Size: $ARCHIVE_SIZE"
echo ""
echo "🚀 To deploy on another computer:"
echo "   1. Copy ${PACKAGE_NAME}.tar.gz to target computer"
echo "   2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "   3. Deploy: cd $PACKAGE_NAME && ./quick-deploy.sh"
echo ""
echo "✅ Ready for deployment!" 