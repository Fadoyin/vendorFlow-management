# ECS Service Module

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.service_name}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.task_execution_role_arn != "" ? var.task_execution_role_arn : aws_iam_role.execution_role.arn
  task_role_arn           = var.task_role_arn != "" ? var.task_role_arn : aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.image_uri
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = var.environment_variables

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.main.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", var.health_check_command]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.service_name}-${var.environment}"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "${var.service_name}-${var.environment}"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnets
    security_groups  = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = var.service_name
    container_port   = var.container_port
  }

  depends_on = [
    aws_iam_role_policy_attachment.execution_role_policy,
    aws_iam_role_policy_attachment.task_role_policy
  ]

  tags = {
    Name        = "${var.service_name}-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.service_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.service_name}-${var.environment}"
    Environment = var.environment
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.service_name}-ecs-tasks-${var.environment}"
  vpc_id      = var.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.container_port
    to_port         = var.container_port
    security_groups = var.alb_security_groups
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.service_name}-ecs-tasks-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for Task Execution
resource "aws_iam_role" "execution_role" {
  name = "${var.service_name}-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.service_name}-execution-role-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for Task
resource "aws_iam_role" "task_role" {
  name = "${var.service_name}-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.service_name}-task-role-${var.environment}"
    Environment = var.environment
  }
}

# Attach policies to execution role
resource "aws_iam_role_policy_attachment" "execution_role_policy" {
  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for task role (S3, Cognito, etc.)
resource "aws_iam_policy" "task_policy" {
  name = "${var.service_name}-task-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminGetUser",
          "cognito-idp:ListUsers"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach custom policy to task role
resource "aws_iam_role_policy_attachment" "task_role_policy" {
  role       = aws_iam_role.task_role.name
  policy_arn = aws_iam_policy.task_policy.arn
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.auto_scaling_max_capacity
  min_capacity       = var.auto_scaling_min_capacity
  resource_id        = "service/${split("/", var.cluster_id)[1]}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - Scale Up
resource "aws_appautoscaling_policy" "ecs_policy_up" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.service_name}-scale-up-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = var.auto_scaling_target_cpu
  }
} 