# Environment Configuration
variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Networking Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# S3 Configuration
variable "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  type        = string
}

# Database Configuration
variable "mongodb_connection_string" {
  description = "MongoDB connection string"
  type        = string
  sensitive   = true
}

# ECS Configuration - Backend
variable "backend_image_uri" {
  description = "Docker image URI for backend service"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "CPU units for backend service"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MB) for backend service"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Desired number of backend service instances"
  type        = number
  default     = 2
}

# ECS Configuration - ML Service
variable "ml_image_uri" {
  description = "Docker image URI for ML service"
  type        = string
  default     = ""
}

variable "ml_cpu" {
  description = "CPU units for ML service"
  type        = number
  default     = 256
}

variable "ml_memory" {
  description = "Memory (MB) for ML service"
  type        = number
  default     = 512
}

variable "ml_desired_count" {
  description = "Desired number of ML service instances"
  type        = number
  default     = 1
}

# Security Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = ""
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 1
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Auto Scaling Configuration
variable "enable_auto_scaling" {
  description = "Enable ECS auto scaling"
  type        = bool
  default     = true
}

variable "auto_scaling_min_capacity" {
  description = "Minimum capacity for auto scaling"
  type        = number
  default     = 1
}

variable "auto_scaling_max_capacity" {
  description = "Maximum capacity for auto scaling"
  type        = number
  default     = 10
}

variable "auto_scaling_target_cpu" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
