#!/bin/sh
set -e

echo "Running migrations..."
until bunx prisma migrate deploy; do
  echo "Waiting for database..."
  sleep 1
done
echo "Migrations done."

exec bun run /app/dist/index.js
