# Deployment Guide

This guide covers deploying the Vendor Management Platform to AWS using the provided infrastructure.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0 installed
- Docker and Docker Compose installed
- MongoDB Atlas account (or local MongoDB)
- Domain name (optional but recommended)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   S3 Bucket     │    │   Route 53      │
│   (Frontend)    │◄──►│   (Static)      │    │   (DNS)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ALB           │    │   ECS Cluster   │    │   VPC           │
│   (Load Bal.)   │◄──►│   (Services)    │◄──►│   (Networking) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ECS Fargate   │    │   ElastiCache   │    │   Cognito      │
│   (Backend/ML)  │    │   (Redis)       │    │   (Auth)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step 1: Environment Setup

### 1.1 Clone and Setup

```bash
git clone <repository-url>
cd cloud-vendor-management
npm install
```

### 1.2 Environment Variables

Copy the environment template and configure:

```bash
cp env.example .env
```

Edit `.env` with your AWS credentials and configuration:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor_management

# AWS Cognito (will be created by Terraform)
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=

# S3 Bucket
S3_BUCKET_NAME=vendor-management-assets-<unique-suffix>
```

### 1.3 AWS CLI Configuration

```bash
aws configure
aws configure set default.region us-east-1
```

## Step 2: Infrastructure Deployment

### 2.1 Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create S3 backend bucket (first time only)
aws s3 mb s3://vendor-management-terraform-state
```

### 2.2 Configure Variables

Create `terraform.tfvars`:

```hcl
environment = "production"
aws_region = "us-east-1"
domain_name = "your-domain.com"
mongodb_connection_string = "mongodb+srv://username:password@cluster.mongodb.net/vendor_management"
s3_bucket_name = "vendor-management-assets-<unique-suffix>"
```

### 2.3 Deploy Infrastructure

```bash
# Plan deployment
terraform plan

# Apply changes
terraform apply

# Save outputs
terraform output > outputs.txt
```

### 2.4 Verify Resources

Check that all resources were created:

```bash
aws ecs list-clusters
aws ecs list-services --cluster vendor-management-cluster
aws s3 ls
aws cognito-idp list-user-pools --max-items 10
```

## Step 3: Application Deployment

### 3.1 Build Docker Images

```bash
# Build backend
cd apps/backend
docker build -t vendor-management-backend:latest .

# Build ML service
cd ../ml-service
docker build -t vendor-management-ml:latest .

# Build frontend
cd ../frontend
docker build -t vendor-management-frontend:latest .
```

### 3.2 Push to ECR

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag vendor-management-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vendor-management-backend:latest
docker tag vendor-management-ml:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vendor-management-ml:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vendor-management-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vendor-management-ml:latest
```

### 3.3 Deploy Frontend to S3

```bash
# Build frontend
cd apps/frontend
npm run build

# Sync to S3
aws s3 sync .next/static s3://<s3-bucket-name>/_next/static --delete
aws s3 sync public s3://<s3-bucket-name>/public --delete
aws s3 cp .next/server/pages s3://<s3-bucket-name>/ --recursive --exclude "*" --include "*.html"
```

### 3.4 Update ECS Services

Update the image URIs in `terraform.tfvars` and redeploy:

```bash
terraform apply
```

## Step 4: Configuration

### 4.1 Update Environment Variables

Update the ECS task definitions with the correct environment variables:

```bash
# Backend service
aws ecs update-service --cluster vendor-management-cluster --service backend --force-new-deployment

# ML service
aws ecs update-service --cluster vendor-management-cluster --service ml-service --force-new-deployment
```

### 4.2 Configure Cognito

1. Go to AWS Cognito Console
2. Select your user pool
3. Add your domain
4. Configure app client settings
5. Update callback URLs

### 4.3 Configure CloudFront

1. Go to CloudFront Console
2. Select your distribution
3. Update origin settings
4. Configure cache behaviors
5. Set up custom error pages

## Step 5: Database Setup

### 5.1 MongoDB Atlas

1. Create a cluster in MongoDB Atlas
2. Configure VPC peering with your AWS VPC
3. Create database user
4. Update connection string in environment variables

### 5.2 Seed Data

```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## Step 6: Testing

### 6.1 Health Checks

```bash
# Backend health
curl https://your-alb-domain/health

# ML service health
curl https://your-alb-domain/ml/health

# Frontend
curl https://your-cloudfront-domain/
```

### 6.2 API Testing

```bash
# Test authentication
curl -X POST https://your-alb-domain/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test vendor endpoint
curl -X GET https://your-alb-domain/api/vendors \
  -H "Authorization: Bearer <token>"
```

## Step 7: Monitoring and Maintenance

### 7.1 CloudWatch Setup

1. Enable detailed monitoring for ECS services
2. Set up CloudWatch alarms for:
   - CPU utilization > 80%
   - Memory utilization > 80%
   - Error rate > 5%
   - Response time > 2s

### 7.2 Logging

```bash
# View ECS service logs
aws logs describe-log-groups --log-group-name-prefix /ecs/

# View application logs
aws logs tail /ecs/backend --follow
aws logs tail /ecs/ml-service --follow
```

### 7.3 Backup Strategy

1. **S3**: Enable versioning and lifecycle policies
2. **MongoDB**: Configure automated backups
3. **ECS**: Use ECR for image versioning
4. **Terraform**: S3 backend with versioning

## Troubleshooting

### Common Issues

1. **ECS Service Won't Start**
   - Check task definition
   - Verify image exists in ECR
   - Check security groups and subnets

2. **Application Errors**
   - Check CloudWatch logs
   - Verify environment variables
   - Check database connectivity

3. **Performance Issues**
   - Monitor CloudWatch metrics
   - Check auto-scaling policies
   - Review database query performance

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster vendor-management-cluster --services backend ml-service

# Check task logs
aws logs describe-log-streams --log-group-name /ecs/backend --order-by LastEventTime --descending

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## Security Considerations

1. **Network Security**
   - Use private subnets for ECS services
   - Restrict ALB access with security groups
   - Enable VPC endpoints for AWS services

2. **Application Security**
   - Use Cognito for authentication
   - Implement JWT validation
   - Enable HTTPS everywhere

3. **Data Security**
   - Encrypt data at rest and in transit
   - Use IAM roles with least privilege
   - Enable CloudTrail for audit logging

## Cost Optimization

1. **ECS Fargate**
   - Use Spot instances for non-critical workloads
   - Right-size CPU and memory
   - Enable auto-scaling

2. **Storage**
   - Use S3 lifecycle policies
   - Enable S3 Intelligent Tiering
   - Use EBS gp3 volumes

3. **Networking**
   - Use NAT Gateway sparingly
   - Consider VPC endpoints for high-traffic services
   - Monitor data transfer costs

## Scaling

### Horizontal Scaling

1. **ECS Auto Scaling**
   - CPU-based scaling
   - Memory-based scaling
   - Custom metrics

2. **Application Scaling**
   - Stateless design
   - Session management
   - Load balancing

### Vertical Scaling

1. **Resource Limits**
   - Increase CPU/memory in task definitions
   - Use larger instance types
   - Optimize application code

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review CloudWatch metrics
   - Check security group rules
   - Monitor costs

2. **Monthly**
   - Update Docker images
   - Review IAM permissions
   - Check for security updates

3. **Quarterly**
   - Review architecture
   - Update Terraform modules
   - Performance testing

### Updates and Patches

```bash
# Update application
git pull origin main
docker build -t new-image:latest .
docker push new-image:latest

# Update ECS service
aws ecs update-service --cluster cluster-name --service service-name --force-new-deployment

# Update infrastructure
terraform plan
terraform apply
```

## Support

For issues and questions:

1. Check CloudWatch logs first
2. Review this deployment guide
3. Check AWS documentation
4. Create an issue in the repository

## Next Steps

1. Set up CI/CD pipeline
2. Implement monitoring dashboards
3. Add automated testing
4. Set up disaster recovery
5. Implement blue-green deployments
