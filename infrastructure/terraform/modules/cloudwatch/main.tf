# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-vendor-management-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # Application Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.environment}-backend-service", "ClusterName", "${var.environment}-cluster"],
            [".", ".", ".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Backend Service CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.environment}-backend-service", "ClusterName", "${var.environment}-cluster"],
            [".", ".", ".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Backend Service Memory Utilization"
          period  = 300
        }
      },
      # ML Service Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.environment}-ml-service", "ClusterName", "${var.environment}-cluster"],
            [".", ".", ".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ML Service CPU Utilization"
          period  = 300
        }
      },
      # Application Load Balancer Metrics
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, "TargetGroup", var.target_group_arn_suffix],
            [".", ".", ".", ".", ".", ".", { "stat": "Sum", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Request Count"
          period  = 300
        }
      },
      # Error Rate
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix, "TargetGroup", var.target_group_arn_suffix],
            [".", ".", ".", ".", ".", ".", { "stat": "Sum", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "5XX Error Count"
          period  = 300
        }
      },
      # Response Time
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, "TargetGroup", var.target_group_arn_suffix],
            [".", ".", ".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Target Response Time"
          period  = 300
        }
      },
      # Database Metrics
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.environment}-mongodb"],
            [".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "MongoDB CPU Utilization"
          period  = 300
        }
      },
      # Redis Metrics
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${var.environment}-redis"],
            [".", ".", ".", ".", { "stat": "Average", "period": 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Redis CPU Utilization"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.environment}-backend"
  retention_in_days = 30

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "ml_service" {
  name              = "/ecs/${var.environment}-ml-service"
  retention_in_days = 30

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.environment}-frontend"
  retention_in_days = 30

  tags = var.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${var.environment}-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors backend CPU utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = "${var.environment}-backend-service"
    ClusterName = "${var.environment}-cluster"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "backend_memory_high" {
  alarm_name          = "${var.environment}-backend-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors backend memory utilization"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ServiceName = "${var.environment}-backend-service"
    ClusterName = "${var.environment}-cluster"
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "error_rate_high" {
  alarm_name          = "${var.environment}-error-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5XX error count"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "response_time_high" {
  alarm_name          = "${var.environment}-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors response time"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  tags = var.common_tags
}

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.environment}-vendor-management-alarms"

  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.alarm_email_addresses)
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_addresses[count.index]
}

# CloudWatch Synthetics Canary for Uptime Monitoring
resource "aws_synthetics_canary" "health_check" {
  name                 = "${var.environment}-health-check"
  artifact_s3_location = "s3://${var.s3_bucket_name}/canary/"
  execution_role_arn   = aws_iam_role.synthetics_role.arn
  handler              = "index.handler"
  zip_file             = "canary.zip"
  runtime_version      = "syn-nodejs-puppeteer-3.9"

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    active_tracing = true
  }

  tags = var.common_tags
}

# IAM Role for Synthetics
resource "aws_iam_role" "synthetics_role" {
  name = "${var.environment}-synthetics-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "synthetics_policy" {
  name = "${var.environment}-synthetics-policy"
  role = aws_iam_role.synthetics_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      }
    ]
  })
}
