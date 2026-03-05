#!/bin/bash
# Connect to local SQLite (default) or prod RDS
# Usage: ./scripts/db.sh [sql]

if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "postgresql"; then
  echo "Connecting to postgres at $DATABASE_URL..."
  if [ -n "$1" ]; then
    psql "$DATABASE_URL" -c "$1"
  else
    psql "$DATABASE_URL"
  fi
else
  DB_PATH="${DB_PATH:-backend/claimpath.db}"
  echo "Connecting to SQLite at $DB_PATH..."
  if [ -n "$1" ]; then
    sqlite3 "$DB_PATH" "$1"
  else
    sqlite3 "$DB_PATH"
  fi
fi
