#!/bin/bash
terraform  -chdir=../ apply -auto-approve


REPOSITORY_URL=$(terraform -chdir=../ output -raw wordle_backend_repository_url)
API_URL=$(terraform -chdir=../ output -raw api_cloudfront_url)
CLOUDFRONT_DISTRIBUTION_ID=$(terraform -chdir=../ output -raw cloudfront_distribution_id)
BUCKET_URL=$(terraform -chdir=../ output -raw bucket_url)
CLOUDFRONT_URL=$(terraform -chdir=../ output -raw cloudfront_url)

export REPOSITORY_URL=$REPOSITORY_URL
export API_URL=$API_URL
export CLOUDFRONT_DISTRIBUTION_ID=$CLOUDFRONT_DISTRIBUTION_ID
export BUCKET_URL=$BUCKET_URL
export CLOUDFRONT_URL=$CLOUDFRONT_URL


./deploy-backend.sh
./deploy-frontend.sh


echo "Deployed successfully!"
echo "API URL: https://$API_URL"
echo "Frontend URL: https://$CLOUDFRONT_URL"
echo "Backend Image Digest: $IMAGE_DIGEST"
