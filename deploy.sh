#!/bin/bash
set -e

echo "🏗️  Building frontend..."
cd frontend && npm run build && cd ..

echo "☁️  Deploying CDK stack..."
cd cdk && npx cdk deploy --require-approval never && cd ..

echo "📦  Syncing frontend to S3..."
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='DocumentsBucket'].OutputValue" \
  --output text)

# Get frontend bucket separately (it's a different output)
CF_URL=$(aws cloudformation describe-stacks \
  --stack-name ClaimPathStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text)

echo "✅  Deployed! App available at: $CF_URL"
