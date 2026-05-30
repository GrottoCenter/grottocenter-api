#!/bin/bash
# Initialize Superset for Grottocenter BI POC
# Run this after `npm run dev:up` once the superset container is running.

set -e

CONTAINER="grotto-superset"
EXPORT_DIR="docker/superset/export"

echo "==> Waiting for Superset container to be ready..."
until docker exec $CONTAINER superset version > /dev/null 2>&1; do
  sleep 2
done

echo "==> Upgrading Superset database..."
docker exec $CONTAINER superset db upgrade

echo "==> Creating admin user..."
docker exec $CONTAINER superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname Grottocenter \
  --email admin@grottocenter.org \
  --password admin || true

echo "==> Initializing Superset..."
docker exec $CONTAINER superset init

echo "==> Importing dashboard export..."
# Copy the export directory into the container, fix permissions, and import
docker cp "$EXPORT_DIR/." $CONTAINER:/tmp/superset-export/
docker exec --user root $CONTAINER chmod -R 755 /tmp/superset-export/
docker exec $CONTAINER superset import-directory --overwrite /tmp/superset-export/

echo ""
echo "==> Superset is ready!"
echo "    URL: http://localhost:8088"
echo "    Login: admin / admin"
echo "    Dashboard and dataset are pre-configured."
