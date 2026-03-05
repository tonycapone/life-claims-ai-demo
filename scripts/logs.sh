#!/bin/bash
# Usage: ./scripts/logs.sh [--since 5m] [--filter ERROR]
set -e

LOG_GROUP="${ECS_LOG_GROUP:-/ecs/claimpath}"
SINCE="${2:-5m}"
FILTER_PATTERN=""

for arg in "$@"; do
  case $arg in
    --since) shift; SINCE="$1"; shift ;;
    --filter) shift; FILTER_PATTERN="--filter-pattern $1"; shift ;;
  esac
done

echo "Tailing logs from: $LOG_GROUP (since $SINCE)"
aws logs tail "$LOG_GROUP" \
  --since "$SINCE" \
  --follow \
  $FILTER_PATTERN
