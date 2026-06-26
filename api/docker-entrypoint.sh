#!/bin/sh
set -e

cd /app/api

echo "Running migrations..."
until bunx prisma migrate deploy; do
  echo "Waiting for database..."
  sleep 1
done
echo "Migrations done."

exec bun run src/index.ts
