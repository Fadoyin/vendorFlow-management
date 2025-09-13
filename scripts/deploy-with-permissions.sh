#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
ENVIRONMENT="development"

echo -e "${GREEN}🚀 VendorFlow Infrastructure Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}AWS Region: ${AWS_REGION}${NC}"

# Function to check AWS credentials
check_aws_credentials() {
    echo -e "\n${YELLOW}🔐 Checking AWS credentials...${NC}"
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
        exit 1
    fi
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ AWS Account: ${AWS_ACCOUNT_ID}${NC}"
}

# Function to check required permissions
check_permissions() {
    echo -e "\n${YELLOW}🔒 Checking AWS permissions...${NC}"
    
    # Test basic permissions
    if ! aws ec2 describe-vpcs --max-items 1 > /dev/null 2>&1; then
        echo -e "${RED}❌ Missing EC2 permissions${NC}"
        exit 1
    fi
    
    if ! aws iam list-roles --max-items 1 > /dev/null 2>&1; then
        echo -e "${RED}❌ Missing IAM permissions${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Basic permissions verified${NC}"
}

# Function to create ECR repositories
create_ecr_repositories() {
    echo -e "\n${YELLOW}📦 Creating ECR repositories...${NC}"
    
    # Create backend repository
    if aws ecr describe-repositories --repository-names vendorflow/backend --region ${AWS_REGION} > /dev/null 2>&1; then
        echo -e "${BLUE}ℹ️ Backend repository already exists${NC}"
    else
        aws ecr create-repository --repository-name vendorflow/backend --region ${AWS_REGION}
        echo -e "${GREEN}✅ Backend repository created${NC}"
    fi
    
    # Create ML service repository
    if aws ecr describe-repositories --repository-names vendorflow/ml-service --region ${AWS_REGION} > /dev/null 2>&1; then
        echo -e "${BLUE}ℹ️ ML service repository already exists${NC}"
    else
        aws ecr create-repository --repository-name vendorflow/ml-service --region ${AWS_REGION}
        echo -e "${GREEN}✅ ML service repository created${NC}"
    fi
    
    # Get repository URIs
    BACKEND_REPO_URL=$(aws ecr describe-repositories --repository-names vendorflow/backend --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text)
    ML_REPO_URL=$(aws ecr describe-repositories --repository-names vendorflow/ml-service --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text)
    
    echo -e "${GREEN}✅ ECR repositories ready:${NC}"
    echo -e "  Backend: ${BACKEND_REPO_URL}"
    echo -e "  ML Service: ${ML_REPO_URL}"
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "\n${YELLOW}🐳 Building and pushing Docker images...${NC}"
    
    # Login to ECR
    echo -e "${YELLOW}Authenticating with ECR...${NC}"
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    
    # Build and push backend
    echo -e "\n${YELLOW}Building backend image...${NC}"
    cd apps/backend
    docker build -t ${BACKEND_REPO_URL}:latest .
    docker push ${BACKEND_REPO_URL}:latest
    echo -e "${GREEN}✅ Backend image pushed${NC}"
    
    # Build and push ML service
    echo -e "\n${YELLOW}Building ML service image...${NC}"
    cd ../ml-service
    docker build -t ${ML_REPO_URL}:latest .
    docker push ${ML_REPO_URL}:latest
    echo -e "${GREEN}✅ ML service image pushed${NC}"
    
    cd ../../
}

# Function to update Terraform variables
update_terraform_vars() {
    echo -e "\n${YELLOW}⚙️ Updating Terraform variables...${NC}"
    
    cd infrastructure/terraform
    
    # Update image URIs in terraform.tfvars
    sed -i "s|backend_image_uri = \".*\"|backend_image_uri = \"${BACKEND_REPO_URL}:latest\"|" terraform.tfvars
    sed -i "s|ml_image_uri = \".*\"|ml_image_uri = \"${ML_REPO_URL}:latest\"|" terraform.tfvars
    
    echo -e "${GREEN}✅ Terraform variables updated${NC}"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "\n${YELLOW}🌩️ Deploying infrastructure...${NC}"
    
    # Validate Terraform configuration
    echo -e "${YELLOW}Validating Terraform configuration...${NC}"
    ./terraform validate
    
    # Plan deployment
    echo -e "\n${YELLOW}Planning deployment...${NC}"
    ./terraform plan -out=tfplan
    
    # Apply deployment
    echo -e "\n${YELLOW}Applying deployment...${NC}"
    ./terraform apply tfplan
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
}

# Function to display deployment results
show_results() {
    echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "\n${YELLOW}📋 Infrastructure Summary:${NC}"
    ./terraform output
    
    echo -e "\n${GREEN}🔗 Access Information:${NC}"
    
    if ./terraform output alb_dns_name > /dev/null 2>&1; then
        ALB_DNS=$(./terraform output -raw alb_dns_name)
        echo -e "  API Endpoint: http://${ALB_DNS}"
        echo -e "  ML Service: http://${ALB_DNS}/api/ml"
        echo -e "  Health Check: http://${ALB_DNS}/health"
    fi
    
    if ./terraform output cloudfront_domain > /dev/null 2>&1; then
        CLOUDFRONT_DOMAIN=$(./terraform output -raw cloudfront_domain)
        echo -e "  Frontend: https://${CLOUDFRONT_DOMAIN}"
    fi
    
    if ./terraform output s3_bucket_name > /dev/null 2>&1; then
        S3_BUCKET=$(./terraform output -raw s3_bucket_name)
        echo -e "  S3 Bucket: ${S3_BUCKET}"
    fi
    
    echo -e "\n${GREEN}✅ VendorFlow is ready to use!${NC}"
}

# Main execution
main() {
    check_aws_credentials
    check_permissions
    create_ecr_repositories
    build_and_push_images
    update_terraform_vars
    deploy_infrastructure
    show_results
}

# Error handling
trap 'echo -e "\n${RED}❌ Deployment failed! Check the error messages above.${NC}"; exit 1' ERR

# Run main function
main

echo -e "\n${GREEN}🎊 Deployment completed successfully!${NC}"
echo -e "${BLUE}Check the DEPLOYMENT_GUIDE.md for detailed documentation.${NC}" 