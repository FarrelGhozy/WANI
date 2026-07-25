#!/bin/bash
set -e

: "${DB_NAME_API:=wani_api}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "${DB_NAME_API}";
EOSQL
