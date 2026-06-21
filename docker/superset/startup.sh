#!/bin/bash
set -e

echo "==> Running database migrations..."
superset db upgrade

echo "==> Creating admin user (if not exists)..."
superset fab create-admin \
  --username "${SUPERSET_ADMIN_USERNAME:-admin}" \
  --firstname "${SUPERSET_ADMIN_FIRSTNAME:-Admin}" \
  --lastname "${SUPERSET_ADMIN_LASTNAME:-Grottocenter}" \
  --email "${SUPERSET_ADMIN_EMAIL:-admin@grottocenter.org}" \
  --password "${SUPERSET_ADMIN_PASSWORD:-changeme}" || true

echo "==> Initializing Superset..."
superset init

# Used by production (Dockerfile CMD runs startup.sh)
echo "==> Ensuring GC_Creator role exists with correct permissions..."
python /app/pythonpath/gc_creator_permissions.py

echo "==> Starting server..."
exec /usr/bin/run-server.sh
