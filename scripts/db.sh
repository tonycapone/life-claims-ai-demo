#!/bin/bash
# db.sh — Connect to local SQLite or prod RDS
# Usage: ./scripts/db.sh [prod]

set -e

if [ "$1" = "prod" ]; then
  # Connect to prod RDS via SSM or bastion
  RDS_HOST=$(aws cloudformation describe-stacks \
    --stack-name ClaimPathStack \
    --query "Stacks[0].Outputs[?OutputKey=='RdsEndpoint'].OutputValue" \
    --output text 2>/dev/null || echo "")

  if [ -z "$RDS_HOST" ]; then
    echo "❌  Could not find RdsEndpoint in CloudFormation outputs."
    echo "    Make sure the ClaimPathStack is deployed."
    exit 1
  fi

  echo "🔗  Connecting to prod RDS at $RDS_HOST..."
  PGPASSWORD="${DB_PASSWORD:-claimpath}" psql \
    -h "$RDS_HOST" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-claimpath}" \
    "$@"
else
  # Local SQLite
  DB_PATH="${1:-$(dirname "$0")/../backend/claimpath.db}"
  if [ ! -f "$DB_PATH" ]; then
    echo "❌  SQLite DB not found at $DB_PATH"
    echo "    Run: npm run db:migrate && npm run db:seed"
    exit 1
  fi
  echo "🔗  Connecting to local SQLite at $DB_PATH..."
  sqlite3 "$DB_PATH"
fi
