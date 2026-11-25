# Health monitoring

`GET /api/v1/health` is probed by two consumers, which react to different signals.

| Consumer                                                        | Looks at                 | Reaction                                  |
| --------------------------------------------------------------- | ------------------------ | ----------------------------------------- |
| App Service health check (`healthCheckPath`, 10 failed pings)   | HTTP status              | Restarts or replaces the instance         |
| `grottocenter api 500 errors alert` (`Http5xx` ≥ 1 over 15 min) | HTTP status              | Emails the `grottocenter-api-alert-group` |
| BetterStack monitor (every 30 s, 30 s timeout)                  | HTTP status **and body** | Pages                                     |

## Statuses

| Top-level `status` | HTTP | Meaning                                                                        |
| ------------------ | ---- | ------------------------------------------------------------------------------ |
| `healthy`          | 200  | Database reachable, Typesense reachable, search collections up to date         |
| `degraded`         | 200  | Everything reachable, but a search collection lacks fields the code declares   |
| `unhealthy`        | 503  | Database or Typesense unreachable, timed out, or failing; wins over `degraded` |

`services.search.status` is `healthy`, `outOfDate` or `unhealthy`. These values are an
alerting contract: `test/integration/4_routes/health.test.js` pins them.

## Timeout budget

`healthCheckTimeoutMs` (5 s) bounds each dependency check. The database check and the search
check run in parallel. Within the search check, `isAlive` and the schema lookup share that one
budget, so the whole probe stays under it.

Only reachability drives `unhealthy`. If Typesense fails or times out on `isAlive`, search is
`unhealthy` (503). Once `isAlive` has succeeded, a schema lookup that fails or runs out of
budget is logged as a warning (`Health check: search index check skipped`) and search is
reported `healthy`, because a 503 would make App Service restart an instance whose search is
reachable.

## Why `degraded` answers 200

A stale search index is fixed by `node scripts/resync-search.js`, not by restarting the
instance, and it is not a crash. Answering 503 would make App Service restart the instance
for nothing and trip the `Http5xx` alert, so the endpoint answers 200 and the BetterStack
monitor looks at the body instead. #1997 added `documents.validationStatus`; until the
resync ran, `POST /api/v1/search` returned 500 for about 22 hours with a green `/health`.

## What counts as out of date

For each entity in `api/dbSync/entities`, `SearchService.checkIndexSchema()` reads the live
collection behind the alias (`GET /collections/<alias>`) and lists the fields declared in
`search.schema.fields` that it lacks (`id` is implicit in Typesense and ignored). Extra
fields on the collection are fine. The result is cached for 10 s, including while it is
being computed, so concurrent callers (health probes, a burst of failing searches) share one
round of lookups. A failed lookup is not cached. It does not compare field
types or options, so a change of type or of `facet`/`sort`/`index` on an existing field is
not detected: resync after those too.

The log line `Health check: search index out of date, run scripts/resync-search.js` names
the collections and fields. The response does not, since the endpoint is public.

## Searches on a stale index answer 500

Typesense answers a filter, sort, facet or query on a missing field with a 4xx, which the
search controllers turn into a 400 ("bad request"). `SearchService` checks the index when
that happens (`guardIndexDrift`, on every `multiCollectionsSearch`, `collectionSearch` and
`fieldSearch`, so also the devices search and the export). The search fails with a plain
error, and the caller gets a **500**, only when both hold:

- a collection the search targets is out of date, and
- the Typesense message names one of its missing fields in backticks
  (``Could not find a filter field named `validationStatus` in the schema.``) or says the
  collection is not found.

That makes the failure count as a server error (and in the `Http5xx` alert) instead of
looking like a client mistake. Every other 4xx keeps its 400 and message, even during a
stale window. This includes a filter on a field that never existed, a bad value, or a search
on a collection that is up to date while another one is stale. The original 4xx is also kept
when the check itself fails. Typesense 5xx, 401 and 403 are never checked.

Typesense's messages are not a contract. If their wording changes, the guard stops matching
and falls back to the plain 400: it can miss a stale index, but never turns a client error
into a 500.

## BetterStack setup (manual, not in the repo)

The existing `/health` monitor alerts on "URL becomes unavailable" (any non-2xx). It cannot
see `degraded`, which answers 200. Add a **second monitor on the same URL**:

- **Alert us when:** "URL contains a keyword" (`keyword_absence`).
- **Keyword:** `"status":"degraded"`, with the quotes. The body is compact JSON.
- Same URL and 30 s interval as the first monitor, and the same on-call policy.
- A confirmation period of a few minutes: a deploy that adds a schema field reports
  `degraded` between the deploy and the end of the resync, which is expected.

Do not use "URL doesn't contain keyword" with `"status":"healthy"`: a degraded body still
contains `"status":"healthy"` for the database service, so it would never fire.

## When you add a field to a search schema

Adding a field to an entity's `search.schema` needs a full resync right after the deploy
(`node scripts/resync-search.js`, see the PR's **Deployment** section). `/health` reports
`degraded` until it is done, and returns to `healthy` within 10 s of the new collection
going live.
