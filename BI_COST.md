# Superset on Azure — Estimated Monthly Cost

| Resource | Tier | Estimated Monthly Cost |
|----------|------|----------------------|
| App Service (Superset) | B1 (1 core, 1.75 GB) | ~€12 |
| Azure Cache for Redis | Basic C0 (250 MB) | ~€5 |
| PostgreSQL (metadata DB) | Shared with existing instance (new schema) | €0 incremental |
| Storage (for thumbnails/cache) | Blob Storage, minimal | < €1 |
| **Total** | | **~€18/month** |

Scale up the App Service tier if more concurrency is needed. Add a Celery worker (~€5/mo as an Azure Container Instance) when query volume grows.
