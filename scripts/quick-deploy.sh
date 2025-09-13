#!/bin/bash

# Quick Deploy Script for VendorFlow to AWS
# This script provides the fastest path to deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 VendorFlow Quick Deploy to AWS${NC}"
echo "=================================="
echo ""

# Check if prerequisites are met
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v aws &> /dev/null || ! command -v terraform &> /dev/null || ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Missing prerequisites. Please install:${NC}"
    echo "- AWS CLI"
    echo "- Terraform"
    echo "- Docker"
    echo "- Node.js"
    echo ""
    echo "Then run: ./scripts/deploy-to-aws.sh"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met!${NC}"
echo ""

# Quick configuration
echo -e "${BLUE}Quick Configuration:${NC}"
echo ""

# Get MongoDB URI
echo "1. MongoDB Atlas Connection String:"
echo "   Example: mongodb+srv://user:pass@cluster.mongodb.net/vendorflow"
read -p "   Enter MongoDB URI: " MONGODB_URI

echo ""
echo "2. AWS Configuration:"
AWS_REGION="us-east-1"
ENVIRONMENT="production"
echo "   Using region: $AWS_REGION"
echo "   Using environment: $ENVIRONMENT"

echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"
echo "This will take approximately 15-20 minutes."
echo ""

# Export variables for the main script
export MONGODB_URI
export AWS_REGION
export ENVIRONMENT
export QUICK_DEPLOY=true

# Run the main deployment script
exec ./scripts/deploy-to-aws.sh 