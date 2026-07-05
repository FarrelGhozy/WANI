#!/bin/bash
set -e

: "${DB_NAME_API:=wani_api}"
: "${DB_NAME_BOT:=wa_bot}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "${DB_NAME_API}";
    CREATE DATABASE "${DB_NAME_BOT}";
EOSQL
