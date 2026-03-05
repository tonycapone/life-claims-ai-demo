#!/bin/bash
# Usage: ./scripts/db.sh [--prod] [SQL query or interactive]
set -e

PROD=false
if [ "$1" = "--prod" ]; then
  PROD=true
  shift
fi

if [ "$PROD" = true ]; then
  RDS_HOST=$(aws cloudformation describe-stacks \
    --stack-name ClaimPathStack \
    --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
    --output text 2>/dev/null || echo "")
  if [ -z "$RDS_HOST" ]; then
    echo "Could not find RDS endpoint. Check CloudFormation outputs."
    exit 1
  fi
  echo "Connecting to prod RDS: $RDS_HOST"
  PGPASSWORD="${DB_PASSWORD:-claimpath}" psql \
    -h "$RDS_HOST" \
    -U "${DB_USER:-postgres}" \
    -d "${DB_NAME:-claimpath}" \
    "$@"
else
  DB_PATH="${DATABASE_URL:-sqlite:///./claimpath.db}"
  if [[ "$DB_PATH" == sqlite* ]]; then
    SQLITE_FILE=$(echo "$DB_PATH" | sed 's/sqlite:\/\/\///')
    cd backend
    echo "Opening local SQLite: $SQLITE_FILE"
    sqlite3 "$SQLITE_FILE"
  else
    echo "Connecting to: $DB_PATH"
    psql "$DB_PATH" "$@"
  fi
fi
