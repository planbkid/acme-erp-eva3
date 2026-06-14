#!/bin/bash
# Backup diario de PostgreSQL (AWS RDS) hacia Amazon S3
# Las credenciales de la BD se cargan desde .env (no versionado en git)

set -e

source /srv/acme-erp/.env

FECHA=$(date +%Y-%m-%d_%H-%M-%S)
ARCHIVO="acme_erp_backup_${FECHA}.sql"
RUTA_LOCAL="/tmp/${ARCHIVO}"
BUCKET="s3://acme-erp-backups-cristobal"

export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$RUTA_LOCAL"

aws s3 cp "$RUTA_LOCAL" "${BUCKET}/${ARCHIVO}"

rm -f "$RUTA_LOCAL"

echo "Backup completado: ${ARCHIVO} subido a ${BUCKET}"
