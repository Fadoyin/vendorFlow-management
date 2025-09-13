#!/bin/bash

# 🔄 VendorFlow Quick Rollback Script
# Use this if you need to quickly revert changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
EC2_KEY="/home/hassan/Desktop/ssh/vendorflow-latest.pem"
EC2_IP="51.20.189.198"
EC2_USER="ubuntu"
PROJECT_DIR="/opt/vendorflow-new"

echo -e "${RED}🔄 VendorFlow Emergency Rollback${NC}"
echo -e "${RED}================================${NC}"
echo

# Function to run commands on EC2
run_on_ec2() {
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_IP" "$1"
}

echo -e "${YELLOW}⚠️  This will restart all services with the last working images.${NC}"
echo -e "${YELLOW}⚠️  Any recent changes will be temporarily reverted.${NC}"
echo
read -p "Are you sure you want to proceed? (y/n): " confirm

if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo -e "${BLUE}Operation cancelled.${NC}"
    exit 0
fi

echo -e "${BLUE}🔄 Performing emergency rollback...${NC}"

# Stop all services
echo -e "${BLUE}🛑 Stopping all services...${NC}"
run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose down"

# Remove any problematic containers
echo -e "${BLUE}🧹 Cleaning up...${NC}"
run_on_ec2 "sudo docker container prune -f"

# Restart services (this will use the last successfully built images)
echo -e "${BLUE}🚀 Restarting services...${NC}"
run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose up -d"

# Wait a moment for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check status
echo -e "${BLUE}🔍 Checking service status...${NC}"
run_on_ec2 "cd $PROJECT_DIR && sudo docker-compose ps"

echo
echo -e "${GREEN}✅ Rollback completed!${NC}"
echo -e "${BLUE}🌐 Your application should be available at:${NC}"
echo -e "   • http://vendorflow.uk"
echo -e "   • http://vendor-flow.co.uk"
echo -e "   • http://51.20.189.198"
echo

# Quick test
echo -e "${BLUE}🧪 Quick health check...${NC}"
if run_on_ec2 "curl -s http://localhost/api/health | grep -q 'ok'"; then
    echo -e "${GREEN}✅ Application is responding${NC}"
else
    echo -e "${RED}❌ Application may still be starting. Wait a few more minutes.${NC}"
fi

echo
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Test your application in the browser"
echo -e "   2. If working, investigate what went wrong with the update"
echo -e "   3. Fix the issue locally before trying to deploy again" 