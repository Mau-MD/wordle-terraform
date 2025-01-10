#!/bin/bash

# Invalidate cloudfront cache
echo "Invalidating cloudfront cache"
aws configure set preview.cloudfront true && aws cloudfront create-invalidation --region us-east-1 --profile terraform --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" --no-cli-pager

echo "Building frontend using API_URL: $API_URL"
cd ../../app && export VITE_API_URL=$API_URL && npm run build

# Deploy frontend to s3
echo "Deploying frontend to s3"
aws s3 sync --delete dist/ s3://${BUCKET_URL%%.*} --region us-east-1 --profile terraform
