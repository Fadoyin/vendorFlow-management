# Service Outputs
output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.main.id
}

output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.main.name
}

output "security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "execution_role_arn" {
  description = "Task execution role ARN"
  value       = aws_iam_role.execution_role.arn
}

output "task_role_arn" {
  description = "Task role ARN"
  value       = aws_iam_role.task_role.arn
} 