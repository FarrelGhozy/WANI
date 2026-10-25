#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  trap - SIGINT SIGTERM
  echo ""
  echo "Shutting down..."
  docker compose -f docker-compose.local.yml stop waha
  kill 0 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting WAHA..."
docker compose -f docker-compose.local.yml up -d waha

# Wait for WAHA to be ready
sleep 5

echo "Starting API..."
(cd api && bun --env-file=../.env --watch run src/index.ts) &

# Wait for API to be ready
sleep 5

echo "Starting Dashboard..."
(cd dashboard && bun run dev) &

wait
