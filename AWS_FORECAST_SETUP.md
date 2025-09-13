# AWS Forecast Integration Setup Guide

This guide provides step-by-step instructions for setting up AWS Forecast integration in VendorFlow.

## Overview

AWS Forecast is Amazon's fully managed time series forecasting service that uses machine learning to deliver highly accurate forecasts. VendorFlow integrates with AWS Forecast to provide enterprise-grade demand forecasting capabilities.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **IAM Role** with AWS Forecast permissions
4. **S3 Bucket** for data storage
5. **VendorFlow Platform** deployed and running

## Step 1: AWS IAM Setup

### Create IAM Policy for AWS Forecast

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "forecast:*",
                "forecastquery:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::vendorflow-forecast-data",
                "arn:aws:s3:::vendorflow-forecast-data/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": "arn:aws:iam::*:role/VendorFlowForecastRole"
        }
    ]
}
```

### Create IAM Role for Forecast Service

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "forecast.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

### Attach Policy to Role

```bash
# Create the policy
aws iam create-policy \
    --policy-name VendorFlowForecastPolicy \
    --policy-document file://forecast-policy.json

# Create the role
aws iam create-role \
    --role-name VendorFlowForecastRole \
    --assume-role-policy-document file://forecast-trust-policy.json

# Attach policy to role
aws iam attach-role-policy \
    --role-name VendorFlowForecastRole \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/VendorFlowForecastPolicy

# Attach AWS managed policy for Forecast
aws iam attach-role-policy \
    --role-name VendorFlowForecastRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonForecastFullAccess
```

## Step 2: S3 Bucket Setup

### Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://vendorflow-forecast-data

# Set bucket policy for Forecast access
aws s3api put-bucket-policy \
    --bucket vendorflow-forecast-data \
    --policy file://s3-bucket-policy.json
```

### S3 Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ForecastAccess",
            "Effect": "Allow",
            "Principal": {
                "Service": "forecast.amazonaws.com"
            },
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::vendorflow-forecast-data",
                "arn:aws:s3:::vendorflow-forecast-data/*"
            ]
        }
    ]
}
```

## Step 3: Environment Configuration

### Update Docker Compose

Add the following environment variables to your `docker-compose.yml`:

```yaml
ml-service:
  environment:
    # Existing variables...
    
    # AWS Configuration
    AWS_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
    AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    
    # AWS Forecast Configuration
    AWS_FORECAST_ROLE_ARN: arn:aws:iam::YOUR_ACCOUNT_ID:role/VendorFlowForecastRole
    AWS_S3_BUCKET: vendorflow-forecast-data
    
    # Forecast Settings
    FORECAST_AUTO_CLEANUP: true
    FORECAST_MAX_CONCURRENT_JOBS: 5
    FORECAST_MIN_DATA_POINTS: 60
    FORECAST_RETENTION_DAYS: 7
```

### Environment Variables File

Create `.env` file with AWS credentials:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# AWS Forecast
AWS_FORECAST_ROLE_ARN=arn:aws:iam::123456789012:role/VendorFlowForecastRole
AWS_S3_BUCKET=vendorflow-forecast-data

# Cost Management
FORECAST_AUTO_CLEANUP=true
FORECAST_MAX_CONCURRENT_JOBS=5
FORECAST_RETENTION_DAYS=7
```

## Step 4: Application Configuration

### Update ML Service Dependencies

The `requirements.txt` has been updated to include:

```txt
# AWS Dependencies
boto3==1.34.0
botocore==1.34.0
awscli==1.32.0
```

### Rebuild ML Service Container

```bash
# Stop current ML service
docker-compose stop ml-service

# Rebuild with new dependencies
docker-compose build ml-service

# Start with new configuration
docker-compose up -d ml-service
```

## Step 5: Testing the Integration

### Test AWS Forecast Availability

```bash
curl -X GET "http://localhost:8002/api/v1/forecasts/status"
```

Expected response:
```json
{
    "enhanced_ml_service": "active",
    "aws_forecast_available": true,
    "current_aws_jobs": 0,
    "max_aws_jobs": 5,
    "local_ml_service": "active",
    "timestamp": "2025-09-06T12:00:00Z"
}
```

### Generate Test Forecast

```bash
curl -X POST "http://localhost:8002/api/v1/forecasts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test_tenant",
    "item_id": "test_item",
    "vendor_id": "test_vendor",
    "forecast_horizon": 30,
    "method": "aws_forecast"
  }'
```

## Step 6: Cost Management

### Monitor AWS Forecast Costs

AWS Forecast pricing includes:
- **Data ingestion**: $0.088 per 1,000 data points
- **Training**: $0.24 per hour
- **Forecasting**: $0.60 per 1,000 forecasts
- **Storage**: Standard S3 pricing

### Cost Optimization Features

1. **Auto-cleanup**: Automatically removes old resources
2. **Concurrent job limits**: Prevents resource overuse
3. **Intelligent method selection**: Uses AWS Forecast only when beneficial
4. **Resource monitoring**: Tracks usage and costs

### Manual Cleanup

```bash
# Clean up resources older than 24 hours
curl -X DELETE "http://localhost:8002/api/v1/forecasts/cleanup?max_age_hours=24"
```

## Step 7: Production Deployment

### AWS ECS Configuration

For production deployment on AWS ECS, update your task definition:

```json
{
    "environment": [
        {
            "name": "AWS_REGION",
            "value": "us-east-1"
        },
        {
            "name": "AWS_FORECAST_ROLE_ARN",
            "value": "arn:aws:iam::123456789012:role/VendorFlowForecastRole"
        }
    ]
}
```

### Terraform Configuration

```hcl
# AWS Forecast IAM Role
resource "aws_iam_role" "forecast_role" {
  name = "VendorFlowForecastRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "forecast.amazonaws.com"
        }
      }
    ]
  })
}

# S3 Bucket for Forecast Data
resource "aws_s3_bucket" "forecast_data" {
  bucket = "vendorflow-forecast-data"
}

# ECS Task Definition Environment Variables
resource "aws_ecs_task_definition" "ml_service" {
  # ... other configuration

  container_definitions = jsonencode([
    {
      # ... other settings
      environment = [
        {
          name  = "AWS_FORECAST_ROLE_ARN"
          value = aws_iam_role.forecast_role.arn
        },
        {
          name  = "AWS_S3_BUCKET"
          value = aws_s3_bucket.forecast_data.id
        }
      ]
    }
  ])
}
```

## API Endpoints

### New AWS Forecast Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/forecasts/generate` | POST | Auto-select best method |
| `/api/v1/forecasts/aws-forecast` | POST | Force AWS Forecast |
| `/api/v1/forecasts/hybrid` | POST | Hybrid approach |
| `/api/v1/forecasts/accuracy` | POST | Evaluate accuracy |
| `/api/v1/forecasts/status` | GET | Service status |
| `/api/v1/forecasts/methods` | GET | Available methods |
| `/api/v1/forecasts/cleanup` | DELETE | Clean up resources |

### Example Usage in Frontend

```javascript
// Generate forecast with auto method selection
const response = await fetch('/api/v1/forecasts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tenant_123',
    item_id: 'item_456',
    vendor_id: 'vendor_789',
    forecast_horizon: 30,
    method: 'auto'
  })
});

const forecast = await response.json();
console.log('Forecast method used:', forecast.method);
console.log('Predictions:', forecast.predictions);
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Verify IAM role and policies
   - Check AWS credentials configuration

2. **Insufficient Data**
   - Ensure minimum 60 data points for AWS Forecast
   - Check data quality metrics

3. **Resource Limits**
   - Monitor concurrent job limits
   - Check AWS service quotas

4. **Timeout Issues**
   - AWS Forecast training can take 1-2 hours
   - Increase timeout settings if needed

### Logs and Monitoring

```bash
# Check ML service logs
docker-compose logs ml-service

# Check AWS Forecast jobs
aws forecast list-predictors --region us-east-1

# Monitor S3 bucket usage
aws s3 ls s3://vendorflow-forecast-data --recursive --human-readable
```

## Security Best Practices

1. **Use IAM roles** instead of access keys in production
2. **Encrypt S3 bucket** with KMS keys
3. **Enable CloudTrail** for audit logging
4. **Rotate credentials** regularly
5. **Monitor costs** and set billing alerts
6. **Use VPC endpoints** for private communication

## Support and Documentation

- [AWS Forecast Documentation](https://docs.aws.amazon.com/forecast/)
- [VendorFlow API Documentation](http://localhost:8002/docs)
- [AWS Forecast Pricing](https://aws.amazon.com/forecast/pricing/)

## Summary

This integration provides VendorFlow with enterprise-grade forecasting capabilities while maintaining cost efficiency through intelligent method selection and resource management. The system automatically falls back to local models when AWS Forecast is not suitable or available, ensuring reliable operation. 