# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.azs[count.index]
  
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-${var.azs[count.index]}"
    Tier = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.azs))
  availability_zone = var.azs[count.index]
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-${var.azs[count.index]}"
    Tier = "private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 2 * length(var.azs))
  availability_zone = var.azs[count.index]
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-database-${var.azs[count.index]}"
    Tier = "database"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-public-rt"
  })
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count          = length(var.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? 1 : 0
  
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-eip"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? 1 : 0
  
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-nat-gateway"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? length(var.azs) : 0
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-private-rt-${var.azs[count.index]}"
  })
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count = var.enable_nat_gateway ? length(var.azs) : 0
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table for Database Subnets
resource "aws_route_table" "database" {
  count = var.enable_nat_gateway ? length(var.azs) : 0
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-database-rt-${var.azs[count.index]}"
  })
}

# Route Table Association for Database Subnets
resource "aws_route_table_association" "database" {
  count = var.enable_nat_gateway ? length(var.azs) : 0
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# VPC Endpoints for AWS Services
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-s3-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  private_dns_enabled = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  private_dns_enabled = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-ecr-dkr-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  private_dns_enabled = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-logs-endpoint"
  })
}

# Data source for current region
data "aws_region" "current" {}
