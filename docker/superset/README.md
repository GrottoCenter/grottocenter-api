# Superset (BI Tool) — Grottocenter

Apache Superset instance for the Scientific Data module.

- **Production URL**: https://bi.grottocenter.org
- **Azure App Service**: `grottocenter-superset` (resource group: `grottocenter-api`)
- **Image registry**: `ghcr.io/grottocenter/superset`
- **Base image**: `apache/superset:6.1.0`

## Local Development

> **Prerequisite:** The main Grottocenter stack must be running first (`npm run dev:up`) so that
> the `grottocenter_default` Docker network exists. Alternatively, create it manually:
> `docker network create grottocenter_default`

```bash
npm run dev:up          # Start the main app stack (PostgreSQL + Typesense)
npm run superset:up     # Start Superset + Redis (http://localhost:8088, admin / admin)
```

## Required Setup: Public Role Permissions

Embedded dashboards use guest tokens that run under the `Public` role (`GUEST_ROLE_NAME` in
`superset_config.py`). In a fresh Superset install, this role has **no permissions**, so embedded
charts will return 403 errors until you grant access.

After first boot, log in as admin and configure the `Public` role:

1. Go to **Settings → List Roles → Public**
2. Add these permissions:
   - `datasource access on [Grottocenter_PostgreSQL].(id:1)` (or the relevant database)
   - `datasource access` on each dataset used by embedded dashboards (e.g., `v_measurement_wide`)
3. Save the role

Alternatively, via CLI inside the container:

```bash
docker exec grotto-superset superset fab add-permission-role \
  --role Public \
  --permission-name "datasource_access" \
  --resource-name "[Grottocenter_PostgreSQL].(id:1)"
```

> **Note:** The embedding path (guest token + dashboard UUID) bypasses the `published` flag,
> but researchers with direct Superset access need the dashboard to be `published: true` to see it
> in the dashboard list.

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
# Use a GitHub PAT with read:packages scope. Prefer a machine/bot account
# (e.g., a dedicated org member) so credentials don't depend on one person.
TOKEN="<GITHUB_PAT_WITH_READ_PACKAGES>"
az webapp config container set \
  --name grottocenter-superset \
  --resource-group grottocenter-api \
  --container-image-name ghcr.io/grottocenter/superset:latest \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user GrottoCenter \
  --docker-registry-server-password "$TOKEN"

# 3. Trigger restart via webhook (URL stored in GitHub Secrets as AZURE_SUPERSET_WEBHOOK_URL)
curl -sf -X POST \
  'https://grottocenter-superset:<webhook-password>@grottocenter-superset.scm.azurewebsites.net/docker/hook'
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
| `SESSION_COOKIE_SECURE` | Set to `true` in production (HTTPS); defaults to `false` |
| `DOCKER_REGISTRY_SERVER_*` | GHCR pull credentials |

## Notes

- The GHCR package is **private** — Azure needs a valid `gh auth token` to pull
- The `gh auth token` expires — if deploys fail with auth errors, re-run the `az webapp config container set` command with a fresh token
- Superset's metadata DB is separate from the Grottocenter app DB
- No Redis in prod — caching uses in-memory `SimpleCache`
