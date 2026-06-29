#!/bin/bash
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
RETAIN_DAYS=${RETAIN_DAYS:-30}
DATE=$(date +%Y%m%d)
FILE="$BACKUP_DIR/cuentitas-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-cuentitas}" \
  "${POSTGRES_DB:-cuentitas}" \
  | gzip > "$FILE"

echo "Backup guardado: $FILE"

# Eliminar backups más viejos que RETAIN_DAYS días
find "$BACKUP_DIR" -name "cuentitas-*.sql.gz" -mtime "+$RETAIN_DAYS" -delete
echo "Limpieza: backups de más de $RETAIN_DAYS días eliminados."
