resource "aws_ecr_repository" "wordle_backend_repository" {
  name         = "wordle-backend-repository"
  force_delete = true
}

// ------ PERMISSIONS ------
resource "aws_iam_role" "ecs_role" {
  name = "wordle-backend-ecs-role"
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
}

resource "aws_iam_role_policy_attachment" "ecs_role_policy_attachment" {
  role = aws_iam_role.ecs_role.name
  // Logging + ECR Permissions
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_cloudwatch_policy" {
  name = "wordle-backend-cloudwatch-policy"
  role = aws_iam_role.ecs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs_logs.arn}:*"
      }
    ]
  })
}

// ------ VPC ------
resource "aws_vpc" "wordle_vpc" {
  cidr_block           = "10.0.0.0/16" // allows 65536 IP addresses
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "wordle-vpc"
  }
}

// We need 2 public subnets because fargate requires 2 AZs
resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.wordle_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "wordle-public-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.wordle_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "wordle-public-b"
  }
}

// The following are everything we need to connect to the internet
resource "aws_internet_gateway" "wordle_igw" {
  vpc_id = aws_vpc.wordle_vpc.id
  tags = {
    Name = "wordle-igw"
  }
}

resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.wordle_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.wordle_igw.id
  }
  tags = {
    Name = "wordle-public-route-table"
  }
}

resource "aws_route_table_association" "public_a_association" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_route_table.id
}

resource "aws_route_table_association" "public_b_association" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_route_table.id
}

// ------ SECURITY GROUP ------
resource "aws_security_group" "wordle_backend_sg" {
  name   = "wordle-backend-sg"
  vpc_id = aws_vpc.wordle_vpc.id

  // only allow inbound HTTP traffic
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  // allow outbound traffic to anywhere
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

// ------ CLOUDWATCH LOGS ------
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/wordle-backend"
  retention_in_days = 14
}

// ------ FARGATE CLUSTER ------
resource "aws_ecs_task_definition" "wordle_backend_task_definition" {
  family = "wordle-backend-task"

  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  memory = "512"
  cpu    = "256"

  execution_role_arn = aws_iam_role.ecs_role.arn
  task_role_arn      = aws_iam_role.ecs_role.arn

  container_definitions = jsonencode([
    {
      name        = "wordle-backend"
      image       = "${aws_ecr_repository.wordle_backend_repository.repository_url}:latest"
      essential   = true
      stopTimeout = 2
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
        interval    = 5
        timeout     = 2
        retries     = 3
        startPeriod = 30
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/wordle-backend"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])
}

// ------ LOAD BALANCER ------
resource "aws_security_group" "alb_sg" {
  name   = "wordle-backend-alb-sg"
  vpc_id = aws_vpc.wordle_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "wordle_backend_lb" {
  name               = "wordle-backend-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

resource "aws_lb_target_group" "wordle_backend_tg" {
  name        = "wordle-backend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.wordle_vpc.id
  target_type = "ip"

  deregistration_delay = 5

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 2
    interval            = 5
    matcher             = "200"
  }
}

resource "aws_lb_listener" "wordle_backend_listener" {
  load_balancer_arn = aws_lb.wordle_backend_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.wordle_backend_tg.arn
  }
}

// To get HTTPS working, we can use cloudfront on top of the ALB
resource "aws_cloudfront_distribution" "wordle_backend_cloudfront" {
  enabled = true

  origin {
    domain_name = aws_lb.wordle_backend_lb.dns_name
    origin_id   = "wordle-backend-lb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "wordle-backend-lb"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      headers      = ["*"] // Forward all headers to maintain functionality
      query_string = true
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

}

resource "aws_ecs_cluster" "wordle_backend_cluster" {
  name = "wordle-backend-cluster"
}

resource "aws_ecs_service" "wordle_backend_service" {
  name            = "wordle-backend-service"
  cluster         = aws_ecs_cluster.wordle_backend_cluster.arn
  task_definition = aws_ecs_task_definition.wordle_backend_task_definition.arn

  launch_type   = "FARGATE"
  desired_count = 1

  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.wordle_backend_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.wordle_backend_tg.arn
    container_name   = "wordle-backend"
    container_port   = 3000
  }
}

// ------ OUTPUTS ------
output "wordle_backend_repository_url" {
  value = aws_ecr_repository.wordle_backend_repository.repository_url
}

output "alb_dns_name" {
  value = aws_lb.wordle_backend_lb.dns_name
}

output "api_cloudfront_url" {
  value = aws_cloudfront_distribution.wordle_backend_cloudfront.domain_name
}
