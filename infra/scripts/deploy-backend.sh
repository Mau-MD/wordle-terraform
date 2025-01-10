#!/bin/bash

# Login Docker to ECR
echo "Logging in to ECR..."
ACCOUNT_ID=$(aws sts get-caller-identity | jq -r ".Account")
PASSWORD=$(aws ecr get-login-password --region us-east-1 --profile terraform)

echo $PASSWORD | docker login --username AWS --password-stdin $REPOSITORY_URL

echo "Building Docker image..."
docker buildx build --platform linux/amd64 -t wordle-backend-repository:latest ../../server/
docker tag wordle-backend-repository:latest $REPOSITORY_URL:latest

echo "Pushing Docker image to ECR..."
IMAGE_DIGEST=$(docker push $REPOSITORY_URL:latest | grep digest | awk '{print $3}')
export IMAGE_DIGEST=$IMAGE_DIGEST

echo "Image pushed to ECR!"

echo "Forcing new deployment in ECS..."
aws ecs update-service --cluster wordle-backend-cluster --service wordle-backend-service --force-new-deployment --region us-east-1 --profile terraform --no-cli-pager

echo "Deployment triggered! Check the AWS Console for status."