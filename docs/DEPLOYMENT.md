# Deployment Guide

## Overview
This guide covers deploying the Vendor Management Platform to production using AWS infrastructure.

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate permissions
- Docker and Docker Compose
- Terraform (v1.0+)
- Node.js (v18+)
- Python (v3.9+)

### AWS Permissions
- ECS Full Access
- S3 Full Access
- CloudFormation Full Access
- IAM Full Access
- VPC Full Access
- CloudWatch Full Access

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd vendor-management-platform
npm install
```

### 2. Environment Configuration
```bash
# Copy environment files
cp env.example .env
cp env.example .env.production

# Edit production environment
nano .env.production
```

### 3. Build and Test Locally
```bash
# Build all services
npm run build

# Test locally
npm run dev
npm run test
```

## AWS Infrastructure Deployment

### 1. Initialize Terraform
```bash
cd infrastructure/terraform
terraform init
terraform plan
```

### 2. Deploy Infrastructure
```bash
# Deploy to staging
terraform workspace new staging
terraform apply -var-file=staging.tfvars

# Deploy to production
terraform workspace new production
terraform apply -var-file=production.tfvars
```

### 3. Verify Deployment
```bash
# Check ECS services
aws ecs list-services --cluster vendor-management-cluster

# Check ALB health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## Service Deployment

### Backend API Deployment
```bash
# Build Docker image
docker build -t vendor-management-backend:latest apps/backend/

# Push to registry
docker tag vendor-management-backend:latest <registry>/vendor-management-backend:latest
docker push <registry>/vendor-management-backend:latest

# Deploy to ECS
aws ecs update-service --cluster vendor-management-cluster --service vendor-management-backend --force-new-deployment
```

### ML Service Deployment
```bash
# Build Docker image
docker build -t vendor-management-ml:latest apps/ml-service/

# Push to registry
docker tag vendor-management-ml:latest <registry>/vendor-management-ml:latest
docker push <registry>/vendor-management-ml:latest

# Deploy to ECS
aws ecs update-service --cluster vendor-management-cluster --service vendor-management-ml --force-new-deployment
```

### Frontend Deployment
```bash
# Build production bundle
cd apps/frontend
npm run build

# Deploy to S3/CloudFront
aws s3 sync out/ s3://<frontend-bucket> --delete
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

## Database Setup

### 1. MongoDB Atlas Setup
```bash
# Create cluster
# Configure network access
# Create database user
# Get connection string
```

### 2. Seed Database
```bash
# Set environment variables
export MONGODB_URI="<your-mongodb-uri>"
export TENANT_ID="<your-tenant-id>"

# Run seed script
node scripts/seed-database.js
```

### 3. Verify Data
```bash
# Connect to MongoDB
mongosh "<connection-string>"

# Check collections
use vendor-management
show collections
db.vendors.find().limit(1)
```

## CI/CD Pipeline

### GitHub Actions Setup
```bash
# Add secrets to GitHub repository
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
DOCKER_REGISTRY=<your-registry>
```

### Pipeline Triggers
- **Push to main**: Deploy to staging
- **Tag release**: Deploy to production
- **Pull request**: Run tests and security scans

### Manual Deployment
```bash
# Deploy specific service
gh workflow run deploy-backend.yml -f service=backend -f environment=production

# Deploy all services
gh workflow run deploy-all.yml -f environment=production
```

## Monitoring Setup

### 1. CloudWatch Configuration
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/ecs/vendor-management-backend
aws logs create-log-group --log-group-name /aws/ecs/vendor-management-ml

# Set retention policy
aws logs put-retention-policy --log-group-name /aws/ecs/vendor-management-backend --retention-in-days 30
```

### 2. Alarms Configuration
```bash
# Create SNS topic for alerts
aws sns create-topic --name vendor-management-alerts

# Subscribe to email/Slack
aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint <email>
```

### 3. Dashboard Setup
```bash
# Import CloudWatch dashboard
aws cloudwatch put-dashboard --dashboard-name vendor-management-main --dashboard-body file://dashboard.json
```

## Security Configuration

### 1. SSL/TLS Setup
```bash
# Request SSL certificate
aws acm request-certificate --domain-name yourdomain.com --validation-method DNS

# Update ALB listener
aws elbv2 modify-listener --listener-arn <listener-arn> --certificates CertificateArn=<certificate-arn>
```

### 2. Security Groups
```bash
# Verify security group rules
aws ec2 describe-security-groups --group-ids <security-group-id>

# Update rules if needed
aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 3. IAM Roles
```bash
# Verify ECS task roles
aws iam get-role --role-name vendor-management-ecs-task-role

# Check policies
aws iam list-attached-role-policies --role-name vendor-management-ecs-task-role
```

## Performance Optimization

### 1. Auto-scaling Configuration
```bash
# Check current scaling policies
aws application-autoscaling describe-scaling-policies --service-namespace ecs

# Update scaling policy
aws application-autoscaling put-scaling-policy --cli-input-json file://scaling-policy.json
```

### 2. CDN Configuration
```bash
# Update CloudFront distribution
aws cloudfront update-distribution --id <distribution-id> --distribution-config file://cloudfront-config.json
```

### 3. Database Optimization
```bash
# Create indexes
mongosh "<connection-string>" --eval "
use vendor-management
db.vendors.createIndex({tenantId: 1, status: 1})
db.items.createIndex({tenantId: 1, sku: 1})
db.purchase_orders.createIndex({tenantId: 1, status: 1})
"
```

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check ECS service events
aws ecs describe-services --cluster vendor-management-cluster --services vendor-management-backend

# Check task logs
aws logs get-log-events --log-group-name /aws/ecs/vendor-management-backend --log-stream-name <stream-name>
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "<connection-string>" --eval "db.runCommand({ping: 1})"

# Check security group rules
aws ec2 describe-security-groups --group-ids <security-group-id>
```

#### High Response Times
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization --dimensions Name=ServiceName,Value=vendor-management-backend

# Check ALB metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name TargetResponseTime
```

### Debug Commands
```bash
# Check service status
docker ps --filter "name=vendor-management"

# View logs
docker logs vendor-management-backend
docker logs vendor-management-ml

# Check resource usage
docker stats vendor-management-backend
```

## Backup and Recovery

### 1. Database Backup
```bash
# Create MongoDB backup
mongodump --uri="<connection-string>" --out=./backups/$(date +%Y%m%d)

# Upload to S3
aws s3 cp ./backups s3://<backup-bucket>/mongodb/ --recursive
```

### 2. Application Backup
```bash
# Backup configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env* infrastructure/

# Backup Docker images
docker save vendor-management-backend:latest | gzip > backend-backup-$(date +%Y%m%d).tar.gz
```

### 3. Recovery Procedures
```bash
# Restore database
mongorestore --uri="<connection-string>" ./backups/<backup-date>

# Restore application
docker load < backend-backup-<date>.tar.gz
```

## Maintenance

### 1. Regular Updates
```bash
# Update dependencies
npm update
pip install --upgrade -r requirements.txt

# Update Docker images
docker pull <registry>/vendor-management-backend:latest
docker pull <registry>/vendor-management-ml:latest
```

### 2. Health Checks
```bash
# Run health checks
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health

# Check ML service
curl https://yourdomain.com/ml/health
```

### 3. Performance Monitoring
```bash
# Monitor key metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name MemoryUtilization
aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name RequestCount
```

## Support and Resources

### Documentation
- [API Documentation](https://yourdomain.com/api/docs)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Testing Guide](docs/TESTING.md)
- [Monitoring Guide](docs/MONITORING.md)

### Contact
- **Technical Support**: tech-support@yourdomain.com
- **Emergency**: oncall@yourdomain.com
- **Documentation**: docs@yourdomain.com

### Useful Links
- [AWS Console](https://console.aws.amazon.com)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch)
- [ECS Console](https://console.aws.amazon.com/ecs)
- [S3 Console](https://console.aws.amazon.com/s3)
