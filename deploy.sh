#!/bin/bash
set -e

echo "Building frontend..."
cd frontend && npm run build && cd ..

echo "Deploying CDK stack..."
cd cdk && npx cdk deploy --require-approval never --outputs-file ../cdk-outputs.json && cd ..

BUCKET=$(jq -r '.ClaimPathStack.FrontendBucketName // empty' cdk-outputs.json 2>/dev/null || \
  aws cloudformation describe-stacks \
    --stack-name ClaimPathStack \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text)

CF_ID=$(jq -r '.ClaimPathStack.CloudFrontDistributionId // empty' cdk-outputs.json 2>/dev/null || \
  aws cloudformation describe-stacks \
    --stack-name ClaimPathStack \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text)

echo "Syncing frontend to S3 bucket: $BUCKET"
aws s3 sync frontend/dist/ "s3://$BUCKET" --delete

echo "Invalidating CloudFront cache: $CF_ID"
aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*"

echo "Deployed! App available at: $CF_URL"
