variable "environment" {
  description = "Environment name"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = null
} 