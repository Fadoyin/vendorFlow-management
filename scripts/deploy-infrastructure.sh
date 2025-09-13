#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
ENVIRONMENT="development"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${GREEN}🚀 Starting VendorFlow Infrastructure Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}AWS Region: ${AWS_REGION}${NC}"
echo -e "${YELLOW}AWS Account: ${AWS_ACCOUNT_ID}${NC}"

# Change to terraform directory
cd infrastructure/terraform

echo -e "\n${GREEN}📋 Step 1: Validating Terraform Configuration${NC}"
./terraform validate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Terraform validation failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🏗️ Step 2: Creating ECR Repositories${NC}"
./terraform apply -target=module.ecr -auto-approve

# Get ECR repository URLs
BACKEND_REPO_URL=$(./terraform output -raw backend_repository_url)
ML_SERVICE_REPO_URL=$(./terraform output -raw ml_service_repository_url)

echo -e "${GREEN}✅ ECR Repositories Created:${NC}"
echo -e "  Backend: ${BACKEND_REPO_URL}"
echo -e "  ML Service: ${ML_SERVICE_REPO_URL}"

# Change back to project root
cd ../..

echo -e "\n${GREEN}🐳 Step 3: Building and Pushing Docker Images${NC}"

# Login to ECR
echo -e "${YELLOW}Authenticating with ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push backend image
echo -e "\n${YELLOW}Building backend image...${NC}"
cd apps/backend
docker build -t ${BACKEND_REPO_URL}:latest .
docker push ${BACKEND_REPO_URL}:latest
echo -e "${GREEN}✅ Backend image pushed successfully${NC}"

# Build and push ML service image
echo -e "\n${YELLOW}Building ML service image...${NC}"
cd ../ml-service
docker build -t ${ML_SERVICE_REPO_URL}:latest .
docker push ${ML_SERVICE_REPO_URL}:latest
echo -e "${GREEN}✅ ML service image pushed successfully${NC}"

# Go back to terraform directory
cd ../../infrastructure/terraform

echo -e "\n${GREEN}⚙️ Step 4: Updating Terraform Variables${NC}"

# Update terraform.tfvars with image URIs
sed -i "s|backend_image_uri = \".*\"|backend_image_uri = \"${BACKEND_REPO_URL}:latest\"|" terraform.tfvars
sed -i "s|ml_image_uri = \".*\"|ml_image_uri = \"${ML_SERVICE_REPO_URL}:latest\"|" terraform.tfvars

echo -e "${GREEN}✅ Updated terraform.tfvars with image URIs${NC}"

echo -e "\n${GREEN}🌩️ Step 5: Deploying Full Infrastructure${NC}"
./terraform plan -out=tfplan
./terraform apply tfplan

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "\n${YELLOW}📋 Infrastructure Summary:${NC}"
./terraform output

echo -e "\n${GREEN}🔗 Access Information:${NC}"
ALB_DNS=$(./terraform output -raw alb_dns_name)
echo -e "  API Endpoint: http://${ALB_DNS}"
echo -e "  ML Service: http://${ALB_DNS}/api/ml"

CLOUDFRONT_DOMAIN=$(./terraform output -raw cloudfront_domain)
echo -e "  Frontend: https://${CLOUDFRONT_DOMAIN}"

S3_BUCKET=$(./terraform output -raw s3_bucket_name)
echo -e "  S3 Bucket: ${S3_BUCKET}"

echo -e "\n${GREEN}✅ VendorFlow infrastructure deployed successfully!${NC}" 