#!/bin/bash
# WANI Database Backup Script
# Runs pg_dump for both wani_api and wa_bot databases

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database connection params from env
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
DB_PASS="${DATABASE_PASSWORD:-}"
DB_API="${DATABASE_NAME_API:-wani_api}"
DB_BOT="${DATABASE_NAME_BOT:-wa_bot}"

export PGPASSWORD="$DB_PASS"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Backup wani_api
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc "$DB_API" > "$BACKUP_DIR/${DB_API}_${TIMESTAMP}.dump"
echo "[$(date)] Backup $DB_API completed: ${DB_API}_${TIMESTAMP}.dump"

# Backup wa_bot
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc "$DB_BOT" > "$BACKUP_DIR/${DB_BOT}_${TIMESTAMP}.dump"
echo "[$(date)] Backup $DB_BOT completed: ${DB_BOT}_${TIMESTAMP}.dump"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days"

echo "[$(date)] All backups completed successfully"
