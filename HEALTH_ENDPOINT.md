# Health Check Endpoint

The Grottocenter API provides a health check endpoint that allows monitoring the status of the API and its dependencies.

## Endpoint

```
GET /api/v1/health
```

## Response Format

The endpoint returns a JSON object with the following structure:

```json
{
  "status": "healthy|unhealthy",
  "timestamp": "2025-11-18T16:06:06.271Z",
  "services": {
    "database": {
      "status": "healthy|unhealthy",
      "message": "Database connection successful"
    },
    "search": {
      "status": "healthy|unhealthy",
      "message": "Search connection successful"
    }
  },
  "build": {
    "gitCommit": "5dc84f50a0987f7e2c58841a0199983933252dc9",
    "buildTime": "2025-11-13T18:55:39.021Z"
  }
}
```

## HTTP Status Codes

- **200 OK**: All services are healthy
- **503 Service Unavailable**: One or more services are unhealthy

## Fields Description

### Root Level
- `status`: Overall health status (`healthy` or `unhealthy`)
- `timestamp`: ISO 8601 timestamp when the health check was performed
- `services`: Object containing the health status of individual services
- `build`: Object containing build information

### Services
- `database`: PostgreSQL database connection status
- `search`: Typesense connection status

Each service contains:
- `status`: Service-specific health status (`healthy` or `unhealthy`)
- `message`: Human-readable message describing the service status

### Build Information
- `gitCommit`: Git commit hash of the current deployment (generated at build time)
- `buildTime`: Timestamp when the current build was generated

## Usage Examples

### Basic Health Check
```bash
curl http://localhost:1337/api/v1/health
```

### Check HTTP Status Code
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/api/v1/health
```

### Pretty Print JSON Response
```bash
curl -s http://localhost:1337/api/v1/health | jq .
```

## Monitoring Integration

This endpoint is designed to be used with monitoring systems like:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Application monitoring tools (Prometheus, Datadog, etc.)
- CI/CD pipeline health verification

## Implementation Notes

- The endpoint is publicly accessible (no authentication required)
- Database health is checked using a simple `SELECT 1` query
- Typesense health uses the built-in health endpoint
- Build information (git commit hash and build time) is generated at build time and stored in `build-info.json`
- Git commit hash is captured during CI/CD using `git log` or `GITHUB_SHA` environment variable
- If any service is unhealthy, the overall status becomes `unhealthy` and HTTP 503 is returned
