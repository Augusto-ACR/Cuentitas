#!/bin/sh
set -e

echo "Ejecutando migraciones..."
node apps/api/dist/migrations-runner.js

echo "Iniciando API..."
exec node apps/api/dist/main.js
