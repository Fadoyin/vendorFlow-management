#!/bin/bash

# VendorFlow AWS Deployment Script
# This script automates the deployment of VendorFlow to AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vendorflow"
AWS_REGION="us-east-1"
TERRAFORM_STATE_BUCKET=""
UNIQUE_ID=$(date +%s)

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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    TERRAFORM_STATE_BUCKET="${PROJECT_NAME}-terraform-state-${UNIQUE_ID}"
    S3_ASSETS_BUCKET="${PROJECT_NAME}-assets-${UNIQUE_ID}"
    
    echo "AWS Account ID: $AWS_ACCOUNT_ID"
    echo "AWS Region: $AWS_REGION"
    echo "Terraform State Bucket: $TERRAFORM_STATE_BUCKET"
    echo "S3 Assets Bucket: $S3_ASSETS_BUCKET"
    
    # Create S3 bucket for Terraform state
    print_status "Creating S3 bucket for Terraform state..."
    aws s3 mb s3://$TERRAFORM_STATE_BUCKET --region $AWS_REGION
    aws s3api put-bucket-versioning --bucket $TERRAFORM_STATE_BUCKET --versioning-configuration Status=Enabled
    
    print_success "Environment setup complete!"
}

# Function to collect user input
collect_user_input() {
    print_status "Collecting deployment configuration..."
    
    # MongoDB connection string
    echo ""
    echo "Enter your MongoDB connection string:"
    echo "Example: mongodb+srv://username:password@cluster.mongodb.net/vendorflow_prod"
    read -p "MongoDB URI: " MONGODB_URI
    
    # JWT Secret
    echo ""
    echo "Enter a secure JWT secret (or press Enter to generate one):"
    read -p "JWT Secret: " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "Generated JWT Secret: $JWT_SECRET"
    fi
    
    # Domain name (optional)
    echo ""
    echo "Enter your domain name (optional, press Enter to skip):"
    read -p "Domain Name: " DOMAIN_NAME
    
    # Environment
    echo ""
    echo "Select environment:"
    echo "1) production"
    echo "2) staging"
    echo "3) development"
    read -p "Environment (1-3): " ENV_CHOICE
    
    case $ENV_CHOICE in
        1) ENVIRONMENT="production" ;;
        2) ENVIRONMENT="staging" ;;
        3) ENVIRONMENT="development" ;;
        *) ENVIRONMENT="production" ;;
    esac
    
    print_success "Configuration collected!"
}

# Function to create Terraform configuration
create_terraform_config() {
    print_status "Creating Terraform configuration..."
    
    cd infrastructure/terraform
    
    # Update backend configuration
    sed -i.bak "s/vendor-management-terraform-state/$TERRAFORM_STATE_BUCKET/g" main.tf
    
    # Create terraform.tfvars
    cat > terraform.tfvars << EOF
# Environment Configuration
environment = "$ENVIRONMENT"
aws_region = "$AWS_REGION"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["${AWS_REGION}a", "${AWS_REGION}b", "${AWS_REGION}c"]

# Domain Configuration
domain_name = "$DOMAIN_NAME"
certificate_arn = ""

# S3 Configuration
s3_bucket_name = "$S3_ASSETS_BUCKET"

# Database Configuration
mongodb_connection_string = "$MONGODB_URI"

# Security Configuration
jwt_secret = "$JWT_SECRET"

# ECS Configuration
backend_image_uri = ""
ml_image_uri = ""
backend_cpu = 512
backend_memory = 1024
backend_desired_count = 2
ml_cpu = 256
ml_memory = 512
ml_desired_count = 1

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1

# Monitoring
enable_monitoring = true
log_retention_days = 14

# Auto Scaling
enable_auto_scaling = true
auto_scaling_min_capacity = 1
auto_scaling_max_capacity = 10
auto_scaling_target_cpu = 70
EOF
    
    cd ../..
    print_success "Terraform configuration created!"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    print_status "Creating Terraform plan..."
    terraform plan -out=tfplan
    
    # Apply infrastructure
    print_status "Applying Terraform configuration..."
    terraform apply tfplan
    
    # Save outputs
    terraform output > ../../terraform-outputs.txt
    
    cd ../..
    print_success "Infrastructure deployed successfully!"
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Create ECR repositories
    aws ecr create-repository --repository-name $PROJECT_NAME-backend --region $AWS_REGION || true
    aws ecr create-repository --repository-name $PROJECT_NAME-ml --region $AWS_REGION || true
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build backend image
    print_status "Building backend image..."
    cd apps/backend
    docker build -f Dockerfile -t $PROJECT_NAME-backend:latest .
    docker tag $PROJECT_NAME-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest
    
    # Build ML service image
    print_status "Building ML service image..."
    cd ../ml-service
    docker build -f Dockerfile -t $PROJECT_NAME-ml:latest .
    docker tag $PROJECT_NAME-ml:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-ml:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-ml:latest
    
    cd ../..
    
    # Update Terraform with image URIs
    cd infrastructure/terraform
    cat >> terraform.tfvars << EOF

# Docker Images (Updated)
backend_image_uri = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend:latest"
ml_image_uri = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-ml:latest"
EOF
    
    # Apply updated configuration
    terraform apply -auto-approve
    
    cd ../..
    print_success "Docker images built and pushed successfully!"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    cd apps/frontend
    
    # Get ALB DNS name
    ALB_DNS=$(cd ../../infrastructure/terraform && terraform output -raw alb_dns_name)
    
    # Set environment variables for build
    export NEXT_PUBLIC_API_URL=https://$ALB_DNS
    export NEXT_PUBLIC_ML_URL=https://$ALB_DNS/ml
    
    # Install dependencies and build
    npm install
    npm run build
    
    # Deploy to S3
    aws s3 sync .next/static s3://$S3_ASSETS_BUCKET/_next/static --delete
    aws s3 sync public s3://$S3_ASSETS_BUCKET/ --delete
    
    cd ../..
    print_success "Frontend deployed successfully!"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Get endpoints
    ALB_DNS=$(cd infrastructure/terraform && terraform output -raw alb_dns_name)
    CLOUDFRONT_DOMAIN=$(cd infrastructure/terraform && terraform output -raw cloudfront_domain)
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 60
    
    # Test backend health
    print_status "Testing backend health..."
    if curl -f -s https://$ALB_DNS/health > /dev/null; then
        print_success "Backend health check passed!"
    else
        print_warning "Backend health check failed. Services may still be starting up."
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f -s https://$CLOUDFRONT_DOMAIN > /dev/null; then
        print_success "Frontend health check passed!"
    else
        print_warning "Frontend health check failed. CDN may still be propagating."
    fi
    
    print_success "Health checks completed!"
}

# Function to display deployment results
display_results() {
    print_success "🎉 Deployment completed successfully!"
    
    # Get outputs
    ALB_DNS=$(cd infrastructure/terraform && terraform output -raw alb_dns_name)
    CLOUDFRONT_DOMAIN=$(cd infrastructure/terraform && terraform output -raw cloudfront_domain)
    COGNITO_USER_POOL_ID=$(cd infrastructure/terraform && terraform output -raw cognito_user_pool_id)
    COGNITO_CLIENT_ID=$(cd infrastructure/terraform && terraform output -raw cognito_client_id)
    
    echo ""
    echo "=== DEPLOYMENT INFORMATION ==="
    echo "Frontend URL: https://$CLOUDFRONT_DOMAIN"
    echo "API URL: https://$ALB_DNS"
    echo "Environment: $ENVIRONMENT"
    echo "AWS Region: $AWS_REGION"
    echo ""
    echo "=== AWS RESOURCES ==="
    echo "S3 Assets Bucket: $S3_ASSETS_BUCKET"
    echo "Terraform State Bucket: $TERRAFORM_STATE_BUCKET"
    echo "Cognito User Pool ID: $COGNITO_USER_POOL_ID"
    echo "Cognito Client ID: $COGNITO_CLIENT_ID"
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Create your first admin user:"
    echo "   curl -X POST https://$ALB_DNS/api/auth/register \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"email\":\"admin@example.com\",\"password\":\"SecurePassword123!\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"role\":\"admin\"}'"
    echo ""
    echo "2. If using a custom domain, update your DNS to point to:"
    echo "   CloudFront: $CLOUDFRONT_DOMAIN"
    echo ""
    echo "3. Monitor your application:"
    echo "   AWS Console: https://console.aws.amazon.com"
    echo "   CloudWatch Logs: /ecs/$PROJECT_NAME-backend-$ENVIRONMENT"
    echo ""
    echo "=== TROUBLESHOOTING ==="
    echo "- Check ECS service status: aws ecs describe-services --cluster $PROJECT_NAME-cluster-$ENVIRONMENT --services $PROJECT_NAME-backend-$ENVIRONMENT"
    echo "- View logs: aws logs tail /ecs/$PROJECT_NAME-backend-$ENVIRONMENT --follow"
    echo "- Terraform outputs: cat terraform-outputs.txt"
    echo ""
    print_success "Happy deploying! 🚀"
}

# Function to cleanup on error
cleanup() {
    print_error "Deployment failed. Cleaning up..."
    
    # Optionally destroy resources
    read -p "Do you want to destroy the created resources? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd infrastructure/terraform
        terraform destroy -auto-approve
        cd ../..
        
        # Delete S3 buckets
        aws s3 rb s3://$TERRAFORM_STATE_BUCKET --force || true
        aws s3 rb s3://$S3_ASSETS_BUCKET --force || true
        
        print_success "Resources cleaned up."
    fi
}

# Main deployment function
main() {
    echo "🚀 VendorFlow AWS Deployment Script"
    echo "===================================="
    echo ""
    
    # Trap errors for cleanup
    trap cleanup ERR
    
    # Run deployment steps
    check_prerequisites
    setup_environment
    collect_user_input
    create_terraform_config
    deploy_infrastructure
    build_and_push_images
    deploy_frontend
    run_health_checks
    display_results
    
    print_success "🎉 All done! Your VendorFlow application is now running on AWS!"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 