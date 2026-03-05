#!/bin/bash
set -e

echo "🏗️  Building frontend..."
cd frontend && npm run build && cd ..

echo "☁️  Deploying CDK stack..."
cd cdk && npx cdk deploy --require-approval never && cd ..

echo "📦  Syncing frontend to S3..."
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

aws s3 sync frontend/dist/ s3://$BUCKET --delete

echo "🔄  Invalidating CloudFront cache..."
CF_ID=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text)

echo "✅  Deployed! App available at: $CF_URL"
