#!/usr/bin/env bash
#
# Script de deploy de Cuentitas en la VPS.
# Trae los últimos cambios de git, reconstruye las imágenes y levanta los contenedores.
#
# Uso:
#   ./deploy.sh          -> git pull + build + up   (deploy normal)
#   ./deploy.sh --seed   -> lo anterior + siembra datos iniciales (SOLO la primera vez)
#
set -euo pipefail

# Pararse siempre en la carpeta del script, sin importar desde dónde se ejecute.
cd "$(dirname "$0")"

echo "==> 1/4  Trayendo los últimos cambios de git..."
git pull --ff-only

if [ ! -f .env ]; then
  echo ""
  echo "ERROR: falta el archivo .env."
  echo "Copiá la plantilla y completá los valores antes de deployar:"
  echo "    cp .env.example .env && nano .env"
  exit 1
fi

echo "==> 2/4  Construyendo y levantando contenedores..."
docker compose up -d --build

if [ "${1:-}" = "--seed" ]; then
  echo "==> 2.5  Esperando a que la API termine de iniciar (migraciones)..."
  sleep 10
  echo "==> 2.5  Sembrando datos iniciales..."
  docker compose exec -T api node apps/api/dist/seed.js
fi

echo "==> 3/4  Limpiando imágenes viejas..."
docker image prune -f >/dev/null 2>&1 || true

echo "==> 4/4  Estado de los contenedores:"
docker compose ps

echo ""
echo "Listo. La app queda en  http://<IP-DE-TU-VPS>:8080"
