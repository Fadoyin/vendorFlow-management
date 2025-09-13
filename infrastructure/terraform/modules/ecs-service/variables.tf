# Service Configuration
variable "service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID"
  type        = string
}



# Task Configuration
variable "image_uri" {
  description = "Docker image URI"
  type        = string
}

variable "cpu" {
  description = "CPU units for the task"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory (MB) for the task"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 3001
}

# Network Configuration
variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "alb_security_groups" {
  description = "ALB security groups"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for the service"
  type        = list(string)
  default     = []
}

variable "task_execution_role_arn" {
  description = "Task execution role ARN"
  type        = string
  default     = ""
}

variable "task_role_arn" {
  description = "Task role ARN"
  type        = string
  default     = ""
}

# Environment Variables
variable "environment_variables" {
  description = "Environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for application assets"
  type        = string
  default     = ""
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Health Check
variable "health_check_command" {
  description = "Health check command"
  type        = string
  default     = "curl -f http://localhost:3001/health || exit 1"
}

# Auto Scaling
variable "enable_auto_scaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = false
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