# Superset Infrastructure Integration

## Current Azure Landscape

| Resource | Type | Domain |
|----------|------|--------|
| Front-end | Static Web App (CDN, West Europe) | grottocenter.org |
| API | App Service (Node.js, France Central) | api.grottocenter.org |
| PostgreSQL | Flexible Server | internal |

## With Superset Added

| Resource | Type | Domain |
|----------|------|--------|
| Front-end | Static Web App (CDN) | grottocenter.org |
| API | App Service (Node.js, code deploy) | api.grottocenter.org |
| **Superset** | **App Service (container, Docker)** | **bi.grottocenter.org** |
| **Redis** | **Azure Cache for Redis** | **internal (no public endpoint)** |
| PostgreSQL | Flexible Server | internal |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  User's browser                                                 │
│                                                                 │
│  grottocenter.org (Static Web App / CDN)                        │
│  ├── React app (SPA)                                            │
│  ├── Calls api.grottocenter.org for data                        │
│  └── Embeds Superset dashboards via SDK                         │
└────────────┬──────────────────────────┬─────────────────────────┘
             │                          │
             │ REST API calls           │ Embedded SDK
             ▼                          ▼
┌────────────────────────┐   ┌────────────────────────────────────┐
│ api.grottocenter.org   │   │ bi.grottocenter.org                │
│ (App Service, Node.js) │   │ (App Service, container)           │
│                        │   │                                    │
│ - Issues guest tokens  │   │ - Serves embedded dashboards       │
│   for Superset embed   │   │ - Queries PostgreSQL directly      │
│ - Writes to PostgreSQL │   │ - Redis for caching                │
└───────────┬────────────┘   └──────────────┬─────────────────────┘
            │                               │
            └───────────┬───────────────────┘
                        ▼
            ┌────────────────────────┐
            │ Azure PostgreSQL       │
            │ Flexible Server        │
            │ (shared data layer)    │
            └────────────────────────┘
```

## How Embedding Works

The front-end uses `@superset-ui/embedded-sdk` to render dashboards inline. Users never leave grottocenter.org.

```jsx
import { embedDashboard } from '@superset-ui/embedded-sdk';

embedDashboard({
  id: 'dashboard-uuid',
  supersetDomain: 'https://bi.grottocenter.org',
  mountPoint: document.getElementById('superset-container'),
  fetchGuestToken: () =>
    fetch('/api/v1/superset/guest-token').then(r => r.json()),
});
```

No redirect, no separate login, no visible Superset chrome.

## Guest Token Flow (Auth Bridge)

The API acts as the authentication bridge between Grottocenter's JWT auth and Superset's guest token system:

1. User is logged into Grottocenter (JWT)
2. Front-end calls `GET /api/v1/superset/guest-token` with the user's JWT
3. API validates the JWT, determines the user's role
4. API calls Superset's internal API to mint a guest token scoped to the appropriate dashboards/datasets
5. Front-end passes that guest token to the embedded SDK

Superset never handles user authentication directly — the API is the gatekeeper.

## CORS Configuration

Superset needs to accept requests from the Static Web App's domain:

```python
CORS_OPTIONS = {
    'origins': ['https://grottocenter.org', 'https://www.grottocenter.org'],
    'supports_credentials': True,
}
```

The Static Web App doesn't need any CORS changes.

## DNS

One new DNS record:

```
bi.grottocenter.org  CNAME  grotto-superset.azurewebsites.net
```

Azure handles the SSL cert via managed certificates on the App Service.

## What Stays Unchanged

- Static Web App deployment (GitHub → Azure) — no changes
- API deployment (GitHub Actions → App Service) — no changes
- PostgreSQL instance — Superset just reads from it
- Existing CDN and DNS for the front-end — no changes
