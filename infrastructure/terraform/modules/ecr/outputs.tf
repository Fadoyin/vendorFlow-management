output "backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ml_service_repository_url" {
  description = "ML service ECR repository URL"
  value       = aws_ecr_repository.ml_service.repository_url
}

output "backend_repository_name" {
  description = "Backend ECR repository name"
  value       = aws_ecr_repository.backend.name
}

output "ml_service_repository_name" {
  description = "ML service ECR repository name"
  value       = aws_ecr_repository.ml_service.name
} 