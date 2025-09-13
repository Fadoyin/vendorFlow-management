#!/bin/bash

# 🚀 VendorFlow Easy Update Deployment Script
# This script makes it super easy to deploy code updates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_KEY="/home/hassan/Desktop/ssh/vendorflow-latest.pem"
EC2_IP="51.20.189.198"
EC2_USER="ubuntu"
PROJECT_DIR="/opt/vendorflow-new"

echo -e "${BLUE}🚀 VendorFlow Easy Update Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Function to run commands on EC2
run_on_ec2() {
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_IP" "$1"
}

# Function to copy files to EC2
copy_to_ec2() {
    rsync -avz --delete -e "ssh -i $EC2_KEY" "$1" "$EC2_USER@$EC2_IP:$2"
}

echo -e "${YELLOW}📋 What would you like to update?${NC}"
echo "1. Full application (backend + frontend + ml-service)"
echo "2. Backend only"
echo "3. Frontend only"
echo "4. ML Service only"
echo "5. Configuration files only (.env, docker-compose, nginx)"
echo
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}🔄 Updating full application...${NC}"
        
        # Copy all application code
        echo -e "${BLUE}📦 Copying application files...${NC}"
        copy_to_ec2 "./apps/" "$PROJECT_DIR/"
        copy_to_ec2 "./packages/" "$PROJECT_DIR/"
        
        # Update and restart all services
        echo -e "${BLUE}🔨 Rebuilding and restarting all services...${NC}"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose down"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose build --no-cache"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d"
        ;;
    2)
        echo -e "${GREEN}🔄 Updating backend only...${NC}"
        
        # Copy backend code
        echo -e "${BLUE}📦 Copying backend files...${NC}"
        copy_to_ec2 "./apps/backend/" "$PROJECT_DIR/apps/"
        
        # Rebuild and restart backend
        echo -e "${BLUE}🔨 Rebuilding backend service...${NC}"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose stop backend"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose build --no-cache backend"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d backend"
        ;;
    3)
        echo -e "${GREEN}🔄 Updating frontend only...${NC}"
        
        # Copy frontend code
        echo -e "${BLUE}📦 Copying frontend files...${NC}"
        copy_to_ec2 "./apps/frontend/" "$PROJECT_DIR/apps/"
        
        # Rebuild and restart frontend
        echo -e "${BLUE}🔨 Rebuilding frontend service...${NC}"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose stop frontend"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose build --no-cache frontend"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d frontend"
        ;;
    4)
        echo -e "${GREEN}🔄 Updating ML Service only...${NC}"
        
        # Copy ML service code
        echo -e "${BLUE}📦 Copying ML service files...${NC}"
        copy_to_ec2 "./apps/ml-service/" "$PROJECT_DIR/apps/"
        
        # Rebuild and restart ML service
        echo -e "${BLUE}🔨 Rebuilding ML service...${NC}"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose stop ml-service"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose build --no-cache ml-service"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d ml-service"
        ;;
    5)
        echo -e "${GREEN}🔄 Updating configuration files only...${NC}"
        
        # Copy config files
        echo -e "${BLUE}📦 Copying configuration files...${NC}"
        copy_to_ec2 "./docker-compose.yml" "$PROJECT_DIR/"
        copy_to_ec2 "./nginx/" "$PROJECT_DIR/"
        
        # Ask if they want to update .env
        read -p "Do you want to update .env file? (y/n): " update_env
        if [[ $update_env == "y" || $update_env == "Y" ]]; then
            if [ -f ".env" ]; then
                copy_to_ec2 "./.env" "$PROJECT_DIR/"
            else
                echo -e "${YELLOW}⚠️  No .env file found locally. Skipping...${NC}"
            fi
        fi
        
        # Restart services to pick up config changes
        echo -e "${BLUE}🔄 Restarting services...${NC}"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose down"
        run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

echo
echo -e "${BLUE}🔍 Checking service status...${NC}"
run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose ps"

echo
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}🌐 Your application is available at:${NC}"
echo -e "   • http://vendorflow.uk"
echo -e "   • http://vendor-flow.co.uk"
echo -e "   • http://51.20.189.198"
echo

# Optional: Test the deployment
read -p "Would you like to test the deployment? (y/n): " test_deploy
if [[ $test_deploy == "y" || $test_deploy == "Y" ]]; then
    echo -e "${BLUE}🧪 Testing deployment...${NC}"
    
    echo "Testing API health..."
    if run_on_ec2 "curl -s http://localhost/api/health | grep -q 'ok'"; then
        echo -e "${GREEN}✅ Backend API is working${NC}"
    else
        echo -e "${RED}❌ Backend API test failed${NC}"
    fi
    
    echo "Testing frontend..."
    if run_on_ec2 "curl -s http://localhost | grep -q 'VendorFlow'"; then
        echo -e "${GREEN}✅ Frontend is working${NC}"
    else
        echo -e "${RED}❌ Frontend test failed${NC}"
    fi
    
    echo "Testing ML service..."
    if run_on_ec2 "curl -s http://localhost/ml/health | grep -q 'status'"; then
        echo -e "${GREEN}✅ ML Service is working${NC}"
    else
        echo -e "${RED}❌ ML Service test failed${NC}"
    fi
fi

echo
echo -e "${GREEN}🎉 All done! Your updated code is now live!${NC}" 