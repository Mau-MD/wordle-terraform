resource "aws_dynamodb_table" "leaderboard" {
  name         = "wordle-leaderboard"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "wordle-leaderboard"
  }
}

// Add DynamoDB permissions to the ECS task role
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "wordle-dynamodb-policy"
  role = aws_iam_role.ecs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.leaderboard.arn
      }
    ]
  })
}
