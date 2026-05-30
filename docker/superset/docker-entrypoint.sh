#!/bin/bash
set -e

EXPORT_DIR="/app/superset-export"

echo "==> Waiting for PostgreSQL to be ready..."
until python -c "import psycopg2; psycopg2.connect('postgresql://root:root@dbserver:5432/grottoce')" 2>/dev/null; do
  sleep 2
done

echo "==> Upgrading Superset database..."
superset db upgrade

echo "==> Creating admin user..."
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname Grottocenter \
  --email admin@grottocenter.org \
  --password admin 2>/dev/null || true

echo "==> Initializing Superset..."
superset init

# Import dashboard if export directory exists and DB is fresh
if [ -d "$EXPORT_DIR/dashboards" ]; then
  echo "==> Importing dashboard export..."
  superset import-directory --overwrite "$EXPORT_DIR/" || true
fi

echo "==> Starting Superset server..."
exec gunicorn "superset.app:create_app()" -b 0.0.0.0:8088 -w 2 --timeout 120
