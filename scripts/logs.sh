#!/bin/bash
# Tail ECS logs from CloudWatch
# Usage: ./scripts/logs.sh [minutes-back]

LOG_GROUP="${LOG_GROUP:-/ecs/claimpath-backend}"
START_TIME="${1:-60}m"

echo "Tailing logs from $LOG_GROUP (last $START_TIME)..."
aws logs tail "$LOG_GROUP" --follow --since "$START_TIME"
