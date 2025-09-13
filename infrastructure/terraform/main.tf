terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "vendorflow-terraform-state-1756739800"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "vendor-management"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr   = var.vpc_cidr
  azs         = var.availability_zones
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment              = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnets         = module.vpc.private_subnets
  public_subnets          = module.vpc.public_subnets
  alb_security_group_id   = module.alb.alb_security_group_id
  
  depends_on = [module.vpc, module.alb]
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnets
  
  depends_on = [module.vpc]
}

# ECS Services
module "backend_service" {
  source = "./modules/ecs-service"
  
  service_name             = "backend"
  environment             = var.environment
  cluster_id              = module.ecs.cluster_id
  vpc_id                  = module.vpc.vpc_id
  subnets                 = module.vpc.private_subnets
  alb_target_group_arn    = module.alb.backend_target_group_arn
  security_group_ids      = [module.ecs.ecs_tasks_security_group_id]
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn          = module.iam.ecs_task_role_arn
  
  image_uri     = var.backend_image_uri
  cpu           = var.backend_cpu
  memory        = var.backend_memory
  desired_count = var.backend_desired_count
  
  depends_on = [module.ecs, module.alb, module.iam]
}

module "ml_service" {
  source = "./modules/ecs-service"
  
  service_name             = "ml-service"
  environment             = var.environment
  cluster_id              = module.ecs.cluster_id
  vpc_id                  = module.vpc.vpc_id
  subnets                 = module.vpc.private_subnets
  alb_target_group_arn    = module.alb.ml_target_group_arn
  security_group_ids      = [module.ecs.ecs_tasks_security_group_id]
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn          = module.iam.ecs_task_role_arn
  
  image_uri     = var.ml_image_uri
  cpu           = var.ml_cpu
  memory        = var.ml_memory
  desired_count = var.ml_desired_count
  
  depends_on = [module.ecs, module.alb, module.iam]
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  bucket_name = var.s3_bucket_name
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment = var.environment
  s3_bucket_domain_name = module.s3.frontend_bucket_domain_name
  domain_name           = var.domain_name
  certificate_arn       = var.certificate_arn
  
  depends_on = [module.s3]
}

# Cognito User Pool
module "cognito" {
  source = "./modules/cognito"
  
  environment = var.environment
  domain_name = var.domain_name
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  environment      = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_cache_nodes
  
  depends_on = [module.vpc]
}

# CloudWatch Logs
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment               = var.environment
  aws_region               = var.aws_region
  alb_arn_suffix           = module.alb.alb_arn_suffix
  target_group_arn_suffix  = module.alb.backend_target_group_arn_suffix
  s3_bucket_name           = module.s3.bucket_name
  s3_bucket_arn           = module.s3.bucket_arn
  
  depends_on = [module.alb, module.s3]
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"
  
  environment = var.environment
  account_id = data.aws_caller_identity.current.account_id
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_id" {
  description = "ECS Cluster ID"
  value       = module.ecs.cluster_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.cloudfront.distribution_domain
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = module.cognito.client_id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.redis.endpoint
}


