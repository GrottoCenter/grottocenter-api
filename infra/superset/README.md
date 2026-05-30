# Superset Infrastructure (Terraform)

Deploys Apache Superset on Azure alongside the existing Grottocenter API.

## Resources Created

- **Azure Linux Web App** (container) — Custom Superset image on the existing App Service Plan
- **Custom domain** + managed SSL certificate — `bi.grottocenter.org`

## Architecture

- Image: `ghcr.io/grottocenter/superset:<tag>` (private, built from `docker/superset/Dockerfile`)
- The image includes `psycopg2-binary` and a `startup.sh` that handles DB migrations, admin creation, and server startup automatically on boot
- Admin credentials and DB connection are passed via environment variables
- No startup command override needed — the image's CMD handles everything

## Prerequisites

1. Terraform >= 1.5
2. Azure CLI authenticated (`az login`)
3. Azure Storage Account `grottocenterterraform` with container `tfstate` (for remote state)
4. DNS: CNAME record `bi.grottocenter.org → grottocenter-superset.azurewebsites.net` (required for cert validation)
5. A PostgreSQL database `superset_meta` on the existing Flexible Server (for Superset metadata)
6. The custom Docker image pushed to `ghcr.io/grottocenter/superset:<tag>`

## Building and Pushing the Docker Image

```bash
cd <repo-root>
docker build --platform linux/amd64 -t ghcr.io/grottocenter/superset:<tag> docker/superset/
gh auth token | docker login ghcr.io -u <github-user> --password-stdin
docker push ghcr.io/grottocenter/superset:<tag>
```

The image is based on `apache/superset:latest-dev` with `psycopg2-binary` added and a custom `startup.sh` entrypoint.

## Usage

```bash
cd infra/superset
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values

terraform init
terraform plan
terraform apply
```

## Post-Deploy

After `terraform apply`, the container auto-initializes on first boot:

1. Runs `superset db upgrade` (creates metadata tables)
2. Creates the admin user from env vars
3. Runs `superset init` (sets up roles and permissions)
4. Starts Gunicorn

Verify: `curl https://bi.grottocenter.org/health` → should return `OK`

Then log in at `https://bi.grottocenter.org` and add the Grottocenter data database connection.

## Updating the Image

When you need to update Superset or change the startup logic:

1. Modify `docker/superset/Dockerfile` or `docker/superset/startup.sh`
2. Build and push with a new tag:
   ```bash
   docker build --platform linux/amd64 -t ghcr.io/grottocenter/superset:<new-tag> docker/superset/
   docker push ghcr.io/grottocenter/superset:<new-tag>
   ```
3. Update `superset_image_tag` in `terraform.tfvars`
4. `terraform apply`

## Costs

| Resource | Tier | ~Monthly |
|----------|------|----------|
| App Service | Shared with existing B2 plan | €0 incremental |
| Managed certificate | Free | €0 |
| Storage (tfstate) | LRS, minimal | < €0.05 |
| **Total** | | **~€0/month** |

## Upgrading: Adding Redis Cache

When dashboard traffic grows or queries become slow (> 5s), add Redis for caching and async query support.

### Step 1: Add Redis to Terraform

Add to `main.tf`:

```hcl
resource "azurerm_redis_cache" "superset" {
  name                = "grottocenter-superset-redis"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name

  capacity             = 0
  family               = "C"
  sku_name             = "Basic"
  minimum_tls_version  = "1.2"
  non_ssl_port_enabled = false

  redis_configuration {}
}
```

### Step 2: Add REDIS_URL to app settings

In the `azurerm_linux_web_app.superset` resource, add to `app_settings`:

```hcl
"REDIS_URL" = "rediss://:${azurerm_redis_cache.superset.primary_access_key}@${azurerm_redis_cache.superset.hostname}:${azurerm_redis_cache.superset.ssl_port}/0"
```

### Step 3: Update Superset config

In `superset_config.py`, change the cache backend:

```python
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL'),
}
DATA_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 600,
    'CACHE_KEY_PREFIX': 'superset_data_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL'),
}
```

### Step 4: Add output (optional)

```hcl
output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.superset.hostname
}
```

### Step 5: Apply

```bash
terraform apply
```

This creates Redis and updates the App Service settings in one operation. Superset restarts (~30s) and picks up Redis. No data loss, no downtime beyond the restart.

### Additional cost after upgrade

| Resource | Tier | ~Monthly |
|----------|------|----------|
| Redis | Basic C0 | ~€12 |

## Notes

- **Caching without Redis**: Superset uses in-memory caching (not shared across workers, cleared on restart). This is fine for low traffic but means repeated dashboard loads won't benefit from a shared cache.
- **Custom config**: The `superset_config.py` file can be baked into the Docker image or mounted via Azure Files. Most settings are passed as environment variables via `app_settings`.
- **Image registry**: The image is stored on GitHub Container Registry (ghcr.io) as a private package under the GrottoCenter org. Registry credentials are passed to Azure via Terraform variables.
