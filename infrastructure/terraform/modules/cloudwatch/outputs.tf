output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_group_backend" {
  description = "Backend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.backend.name
}

output "log_group_ml_service" {
  description = "ML Service CloudWatch log group name"
  value       = aws_cloudwatch_log_group.ml_service.name
}

output "log_group_frontend" {
  description = "Frontend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.frontend.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.alarms.name
}

output "canary_name" {
  description = "Synthetics canary name"
  value       = aws_synthetics_canary.health_check.name
}

output "canary_arn" {
  description = "Synthetics canary ARN"
  value       = aws_synthetics_canary.health_check.arn
}
