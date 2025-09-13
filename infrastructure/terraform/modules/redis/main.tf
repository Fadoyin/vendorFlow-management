resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = var.private_subnets

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.environment}-redis-"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "${var.environment}-redis"
  description                  = "Redis cluster for ${var.environment}"
  
  node_type                    = var.node_type
  port                         = 6379
  parameter_group_name         = "default.redis7"
  
  num_cache_clusters           = var.num_cache_nodes
  automatic_failover_enabled   = var.num_cache_nodes > 1
  multi_az_enabled            = var.num_cache_nodes > 1
  
  subnet_group_name           = aws_elasticache_subnet_group.main.name
  security_group_ids          = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  
  apply_immediately           = true
  
  tags = {
    Environment = var.environment
  }
} 