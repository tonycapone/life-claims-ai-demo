#!/bin/bash
set -e

# ── Colors ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DOMAIN="claimpath.click"
STACK="ClaimPathStack"
DEPLOY_COMMIT_FILE=".deploy-commit"

# ── Parse args ─────────────────────────────────────────────────────────────
SKIP_TESTS=false
CDK_ARGS=""
for arg in "$@"; do
  case $arg in
    --skip-tests) SKIP_TESTS=true ;;
    *) CDK_ARGS="$CDK_ARGS $arg" ;;
  esac
done

echo -e "${CYAN}━━━ ClaimPath Deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 1. Pre-deploy checks ──────────────────────────────────────────────────
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${YELLOW}⚠  Uncommitted changes detected. Commit before deploying.${NC}"
  git status --short
  read -p "Deploy anyway? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# Show what we're deploying
if [[ -f "$DEPLOY_COMMIT_FILE" ]]; then
  LAST_DEPLOY=$(cat "$DEPLOY_COMMIT_FILE")
  echo -e "\n${CYAN}Commits since last deploy:${NC}"
  git log --oneline "$LAST_DEPLOY"..HEAD 2>/dev/null || echo "(first deploy)"
else
  echo -e "\n${CYAN}First deploy — all commits will be included.${NC}"
fi

echo ""
read -p "Continue with deploy? (Y/n) " -n 1 -r
echo
[[ $REPLY =~ ^[Nn]$ ]] && exit 0

# ── 2. Tests ───────────────────────────────────────────────────────────────
if [[ "$SKIP_TESTS" == "false" ]]; then
  echo -e "\n${CYAN}Running backend tests...${NC}"
  cd backend && .venv/bin/python -m pytest --disable-warnings -q tests/ && cd ..

  echo -e "\n${CYAN}Running frontend tests...${NC}"
  cd frontend && npx vitest run && cd ..
else
  echo -e "\n${YELLOW}Skipping tests (--skip-tests)${NC}"
fi

# ── 3. Build frontend ─────────────────────────────────────────────────────
echo -e "\n${CYAN}Building frontend...${NC}"
cd frontend && npm run build && cd ..

# ── 4. CDK deploy ─────────────────────────────────────────────────────────
echo -e "\n${CYAN}Deploying CDK stack...${NC}"
cd cdk && npx cdk deploy $STACK --require-approval never --outputs-file ../cdk-outputs.json $CDK_ARGS && cd ..

# ── 5. Sync frontend to S3 ────────────────────────────────────────────────
BUCKET=$(jq -r ".$STACK.FrontendBucketName // empty" cdk-outputs.json 2>/dev/null)
CF_ID=$(jq -r ".$STACK.CloudFrontDistributionId // empty" cdk-outputs.json 2>/dev/null)

if [[ -z "$BUCKET" || -z "$CF_ID" ]]; then
  echo -e "${RED}Could not read stack outputs. Check cdk-outputs.json.${NC}"
  exit 1
fi

echo -e "\n${CYAN}Syncing frontend to S3: $BUCKET${NC}"
aws s3 sync frontend/dist/ "s3://$BUCKET" --delete

# ── 6. CloudFront invalidation ────────────────────────────────────────────
echo -e "\n${CYAN}Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*" --query 'Invalidation.Id' --output text

# ── 7. Record deployed commit ─────────────────────────────────────────────
git rev-parse HEAD > "$DEPLOY_COMMIT_FILE"

echo -e "\n${GREEN}━━━ Deploy complete! ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  https://${DOMAIN}${NC}"
echo ""
