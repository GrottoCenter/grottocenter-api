# Dashboard Strategy: System + User-Created

## Two-Tier Approach

### Tier 1: System Dashboard (Automatic, Per Observation)

A single template dashboard that works for any observation. The front-end embeds it with a row-level security filter scoped to the current observation/cave/point.

- Always there, always works
- Shows standard time series, contamination, and activity charts
- No user action needed — every observation page gets it for free
- Data is live (queries `v_measurement_wide` directly)

**How it works:**

```
User visits /observations/42
    │
    ▼
Front-end calls API: GET /api/v1/superset/guest-token?observation_id=42
    │
    ▼
API mints a guest token with:
  - resource: the single "Observation Dashboard" template
  - rls (row-level security): "observation_id = 42"
    │
    ▼
Front-end embeds dashboard with that token
    │
    ▼
Superset renders the dashboard with
WHERE observation_id = 42 injected into every query
```

Can also scope by cave or point:

```javascript
// For a cave page
rls: [{ clause: `cave_id = ${caveId}` }]

// For a point page
rls: [{ clause: `point_label = '${pointLabel}'` }]
```

### Tier 2: User-Created Dashboards (Custom, Linked to Observations)

Users create custom dashboards in Superset (their own chart selections, layouts, annotations) and link them to specific observations.

**Junction table:**

```sql
CREATE TABLE t_observation_dashboard (
  id SERIAL PRIMARY KEY,
  id_observation INT NOT NULL REFERENCES t_observation(id),
  dashboard_uuid VARCHAR(100) NOT NULL,  -- Superset embed UUID
  id_author INT NOT NULL REFERENCES t_caver(id),
  title VARCHAR(300) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  date_inscription TIMESTAMP NOT NULL DEFAULT now()
);
```

**Creator flow:**

1. Builds a custom dashboard in Superset (filtered to their observation)
2. Publishes it in Superset
3. On the Grottocenter observation page, clicks "Link my dashboard"
4. Pastes the dashboard UUID (or picks from a list via Superset API)
5. API stores the link in `t_observation_dashboard`

**Viewer flow:**

1. Visits observation page
2. Sees the system dashboard (Tier 1, always present)
3. Sees "Custom dashboards by other users" section below
4. Each one is embedded via its own guest token

## Guest Token Endpoint

Single API endpoint that handles both tiers:

```javascript
// GET /api/v1/superset/guest-token?observation_id=42&dashboard_uuid=optional
module.exports = async (req, res) => {
  const { observation_id, cave_id, point_id, dashboard_uuid } = req.query;

  // Determine which dashboard to embed
  const embedId = dashboard_uuid || SYSTEM_OBSERVATION_DASHBOARD_UUID;

  // Build RLS clause based on scope
  const rls = [];
  if (observation_id) rls.push({ clause: `observation_id = ${observation_id}` });
  if (cave_id) rls.push({ clause: `cave_id = ${cave_id}` });
  if (point_id) rls.push({ clause: `point_label = '${point_id}'` });

  // Mint guest token from Superset API
  const guestToken = await supersetApi.post('/api/v1/security/guest_token/', {
    resources: [{ type: 'dashboard', id: embedId }],
    user: { username: 'guest', first_name: 'Guest', last_name: 'User' },
    rls,
  });

  return res.json({ token: guestToken.token });
};
```

## Visibility Controls

| Layer | Who Controls | Effect |
|-------|-------------|--------|
| Superset Published flag | Dashboard creator | Draft vs. visible inside Superset |
| `t_observation_dashboard.is_published` | Dashboard creator | Whether it appears on the observation page |
| Guest token RLS | API (automatic) | Scopes data to the current observation/cave/point |
| System template | Admins | Always visible, not user-controllable |

## Why No Event-Driven Architecture Needed

- New observation created → system template works immediately (live query)
- New time series uploaded → data appears in dashboards automatically
- User creates custom dashboard → manual "link" button (explicit, predictable)
- The dashboard templates are static; the data is dynamic (filtered per page)

## Recommendation

**Phase 1 (launch):**
- Tier 1 system template dashboard — immediate value, zero user action
- Guest token endpoint for anonymous embedding

**Phase 2 (later):**
- OAuth integration for Superset login
- Tier 2 user-created dashboards with manual linking
- "Share my dashboard on this observation" button

**Phase 3 (if needed):**
- Auto-linking via Flask signal (event-driven) if manual linking proves too friction-heavy
