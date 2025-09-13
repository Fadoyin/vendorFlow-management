output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = aws_lb_target_group.backend.arn
}

output "ml_target_group_arn" {
  description = "ML target group ARN"
  value       = aws_lb_target_group.ml.arn
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix"
  value       = aws_lb.main.arn_suffix
}

output "backend_target_group_arn_suffix" {
  description = "Backend target group ARN suffix"
  value       = aws_lb_target_group.backend.arn_suffix
}

output "ml_target_group_arn_suffix" {
  description = "ML target group ARN suffix"
  value       = aws_lb_target_group.ml.arn_suffix
} 