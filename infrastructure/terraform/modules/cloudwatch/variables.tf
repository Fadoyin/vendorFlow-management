variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alb_arn_suffix" {
  description = "Application Load Balancer ARN suffix"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "Target Group ARN suffix"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for canary artifacts"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  type        = string
  default     = ""
}

variable "alarm_email_addresses" {
  description = "Email addresses for alarm notifications"
  type        = list(string)
  default     = []
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}
