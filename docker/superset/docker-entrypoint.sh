#!/bin/bash
set -e

EXPORT_DIR="/app/superset-export"

# Use SQLALCHEMY_DATABASE_URI for the readiness probe (falls back to local defaults)
DB_URI="${SQLALCHEMY_DATABASE_URI:-postgresql://root:root@dbserver:5432/grottoce}"

echo "==> Waiting for PostgreSQL to be ready..."
until python -c "import psycopg2; psycopg2.connect('${DB_URI}')" 2>/dev/null; do
  sleep 2
done

echo "==> Upgrading Superset database..."
superset db upgrade

echo "==> Creating admin user..."
superset fab create-admin \
  --username "${SUPERSET_ADMIN_USERNAME:-admin}" \
  --firstname "${SUPERSET_ADMIN_FIRSTNAME:-Admin}" \
  --lastname "${SUPERSET_ADMIN_LASTNAME:-Grottocenter}" \
  --email "${SUPERSET_ADMIN_EMAIL:-admin@grottocenter.org}" \
  --password "${SUPERSET_ADMIN_PASSWORD:-changeme}" 2>/dev/null || true

echo "==> Initializing Superset..."
superset init

# Import dashboard if export directory exists and DB is fresh
if [ -d "$EXPORT_DIR/dashboards" ]; then
  # Work on a copy so we don't mutate the volume-mounted source
  IMPORT_DIR="/tmp/superset-import"
  cp -r "$EXPORT_DIR" "$IMPORT_DIR"

  echo "==> Patching database export with actual credentials..."
  DB_EXPORT="$IMPORT_DIR/databases/Grottocenter_PostgreSQL.yaml"
  if [ -f "$DB_EXPORT" ]; then
    sed -i "s|postgresql+psycopg2://USERNAME:PASSWORD@|postgresql+psycopg2://${POSTGRES_USER:-root}:${POSTGRES_PASSWORD:-root}@|" "$DB_EXPORT"
  fi

  echo "==> Importing dashboard export..."
  superset import-directory --overwrite "$IMPORT_DIR/" || echo "==> Warning: dashboard import failed, continuing anyway"
  rm -rf "$IMPORT_DIR"
fi

echo "==> Starting Superset server..."
exec gunicorn "superset.app:create_app()" -b 0.0.0.0:8088 -w 2 --timeout 120
