# Superset (BI Tool) — Grottocenter

Apache Superset instance for the Scientific Data module.

- **Production URL**: https://bi.grottocenter.org
- **Azure App Service**: `grottocenter-superset` (resource group: `grottocenter-api`)
- **Image registry**: `ghcr.io/grottocenter/superset`
- **Base image**: `apache/superset:6.1.0`

## Local Development

```bash
npm run dev:up          # Starts Superset + PostgreSQL + Redis
# Access at http://localhost:8088 (admin / admin)
```

## Configuration

- `superset_config.py` — Superset settings (branding, CSP, CORS, caching, features)
- `branding/` — Logo SVG and favicon (copied into the image at build)
- `startup.sh` — Container entrypoint (migrations, admin creation, server start)

## Deployment (CI)

On push to `develop` with changes in `docker/superset/**`, the GitHub Actions workflow (`.github/workflows/superset.yml`) automatically:

1. Builds the image for `linux/amd64`
2. Pushes to `ghcr.io/grottocenter/superset:latest` and `:$SHA`
3. Calls the Azure webhook to trigger a container pull + restart

## Manual Deployment

When you need to deploy outside of CI (e.g., hotfix, config change):

```bash
# 1. Build and push (from repo root)
docker buildx build --platform linux/amd64 \
  -t ghcr.io/grottocenter/superset:latest \
  docker/superset/ --push

# 2. Set credentials and image tag on Azure
TOKEN=$(gh auth token)
az webapp config container set \
  --name grottocenter-superset \
  --resource-group grottocenter-api \
  --container-image-name ghcr.io/grottocenter/superset:latest \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user ClemRz \
  --docker-registry-server-password "$TOKEN"

# 3. Trigger restart via webhook
curl -sf -X POST \
  'https://$grottocenter-superset:<password>@grottocenter-superset.scm.azurewebsites.net/docker/hook'
```

The webhook URL (with credentials) is stored in GitHub Secrets as `AZURE_SUPERSET_WEBHOOK_URL`.

## Troubleshooting

```bash
# View live logs
az webapp log tail --name grottocenter-superset --resource-group grottocenter-api

# Force restart
az webapp restart --name grottocenter-superset --resource-group grottocenter-api

# Check current image
az webapp config container show --name grottocenter-superset --resource-group grottocenter-api
```

## Environment Variables (Azure App Settings)

| Variable | Purpose |
|----------|---------|
| `SQLALCHEMY_DATABASE_URI` | Superset metadata DB (PostgreSQL on Azure) |
| `SUPERSET_SECRET_KEY` | Flask session encryption |
| `SUPERSET_ADMIN_USERNAME` | Admin account username |
| `SUPERSET_ADMIN_PASSWORD` | Admin account password |
| `DOCKER_REGISTRY_SERVER_*` | GHCR pull credentials |

## Notes

- The GHCR package is **private** — Azure needs a valid `gh auth token` to pull
- The `gh auth token` expires — if deploys fail with auth errors, re-run the `az webapp config container set` command with a fresh token
- Superset's metadata DB is separate from the Grottocenter app DB
- No Redis in prod — caching uses in-memory `SimpleCache`
