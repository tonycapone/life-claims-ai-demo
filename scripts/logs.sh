#!/bin/bash
# logs.sh — Tail ECS logs from CloudWatch
# Usage: ./scripts/logs.sh [--since 10m]

set -e

LOG_GROUP="${ECS_LOG_GROUP:-/ecs/claimpath-backend}"
SINCE="${1:---since}"
SINCE_VAL="${2:-10m}"

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Usage: ./scripts/logs.sh [--since <duration>]"
  echo "  duration examples: 5m, 1h, 2024-01-01T00:00:00"
  echo "  Defaults to last 10 minutes."
  exit 0
fi

echo "📋  Tailing logs from $LOG_GROUP (since $SINCE_VAL)..."
aws logs tail "$LOG_GROUP" --since "$SINCE_VAL" --follow
