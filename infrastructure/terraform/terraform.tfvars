# Environment Configuration
environment = "development"
aws_region = "us-east-1"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Domain Configuration
domain_name = ""
certificate_arn = ""

# S3 Configuration
s3_bucket_name = "vendorflow-assets-1756739800"

# Database Configuration
mongodb_connection_string = "mongodb+srv://fadoyintaiwo01:<db_password>@cluster0.wkxj1sg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Security Configuration
jwt_secret = "Fs5jityoPfsnYWIIeJjqvb7nAEsMKah7EG3JcToVB3M="

# ECS Configuration
backend_image_uri = "682919447024.dkr.ecr.us-east-1.amazonaws.com/vendorflow/backend:latest"
ml_image_uri = "682919447024.dkr.ecr.us-east-1.amazonaws.com/vendorflow/ml-service:latest"
backend_cpu = 512
backend_memory = 1024
backend_desired_count = 2
ml_cpu = 256
ml_memory = 512
ml_desired_count = 1

# Redis Configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1

# Monitoring
enable_monitoring = true
log_retention_days = 14

# Auto Scaling
enable_auto_scaling = true
auto_scaling_min_capacity = 1
auto_scaling_max_capacity = 10
auto_scaling_target_cpu = 70
