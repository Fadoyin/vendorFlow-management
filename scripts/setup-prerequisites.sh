#!/bin/bash

# VendorFlow AWS Prerequisites Setup Script
# This script installs all required tools for AWS deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 VendorFlow AWS Prerequisites Setup${NC}"
echo "====================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}" 
   exit 1
fi

echo -e "${BLUE}📦 Installing prerequisites...${NC}"
echo ""

# Update package manager
echo -e "${BLUE}Updating package manager...${NC}"
sudo apt update

# Install required packages
echo -e "${BLUE}Installing required packages...${NC}"
sudo apt install -y curl unzip wget gnupg software-properties-common

# Install AWS CLI v2
echo -e "${BLUE}Installing AWS CLI v2...${NC}"
if ! command_exists aws; then
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo -e "${GREEN}✅ AWS CLI installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  AWS CLI already installed${NC}"
fi

# Install Terraform
echo -e "${BLUE}Installing Terraform...${NC}"
if ! command_exists terraform; then
    # Add HashiCorp GPG key
    wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    
    # Add HashiCorp repository
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    
    # Update and install
    sudo apt update
    sudo apt install -y terraform
    echo -e "${GREEN}✅ Terraform installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Terraform already installed${NC}"
fi

# Install Docker (if not already installed)
echo -e "${BLUE}Checking Docker installation...${NC}"
if ! command_exists docker; then
    echo -e "${BLUE}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
    echo -e "${YELLOW}⚠️  Please logout and login again for Docker permissions to take effect${NC}"
else
    echo -e "${YELLOW}⚠️  Docker already installed${NC}"
fi

# Check Node.js
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command_exists node; then
    echo -e "${BLUE}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js already installed ($(node --version))${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Prerequisites installation complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Configure AWS credentials:"
echo "   aws configure"
echo ""
echo "2. Verify installations:"
echo "   aws --version"
echo "   terraform --version"
echo "   docker --version"
echo "   node --version"
echo ""
echo "3. Test AWS connection:"
echo "   aws sts get-caller-identity"
echo ""
echo "4. Run the deployment:"
echo "   ./scripts/quick-deploy.sh"
echo ""
echo -e "${YELLOW}💡 Note: If you installed Docker, please logout and login again for permissions to take effect.${NC}"
echo ""
echo -e "${GREEN}✅ Ready for AWS deployment!${NC}" 