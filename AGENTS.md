# Grottocenter API — Agent Guide

> AI agent and contributor reference for the Grottocenter backend.
> Human setup and history live in [`README.md`](README.md); the full role matrix in [`PERMISSION_SYSTEM.md`](PERMISSION_SYSTEM.md).

---

## 📋 Project Overview

**Grottocenter** is a collaborative wiki database for cavers (speleologists), built and maintained by the Wikicaves community. This repository is the REST API behind the [front end](https://github.com/GrottoCenter/grottocenter-front).

- **Production API**: <https://api.grottocenter.org>
- **OpenAPI spec**: `assets/swaggerV1.yaml` (served at `/api/v1/swagger.yaml`)
- **License**: AGPL-3.0 (code), CC-BY-SA-3.0 (data)

---

## 📚 Domain

### Vocabulary

- A **cavity** = one **entrance** + one **cave**. Every entrance belongs to exactly one cave (`t_entrance.id_cave` is always set); a cave with 2+ entrances is a **network**.
- Only entrances have coordinates (`latitude`, `longitude`, `point_geom`). A cave's location and massifs are derived from its entrances.
- A **massif** is a polygon; an entrance belongs to it when `ST_Contains(massif.geog_polygon, entrance.point_geom)`.
- **Organization**, not grotto. The table is still `t_grotto` / `TGrotto`; use "organization" in new code.
- **Entrance**, not entry ("entry" was a mistranslation of _entrée_).
- **Persons** live in `t_caver`: _users_ have an account; _authors_ are credit-only records created by users (no password, placeholder email such as `1649883960918@mail.no`).

### Scientific observations

Data chain: **Device → SensorConfiguration → Observation → TimeSeries → Measurement**.

- `TObservation` is a collection event at a `TPoint` (a named location in a cave).
- `TTimeSeries` denormalizes quantity kind, unit, medium and substance from its sensor configuration at import time.
- Reference tables: `TUnit`, `TQuantityKind`, `TMedium`, `TSubstance`.
- `POST /api/v1/observations/import` is one atomic ETL: profile validation → reference checks → CSV parsing → timestamp conversion → SI conversion → transactional writes. Devices and sensor configurations must already exist; the import does not create them.

### Roles

`Administrator`, `Moderator`, `Leader`, plus authenticated users and anonymous visitors (`PERMISSION_SYSTEM.md` counts these five; the last two are implicit, not groups). **Roles are not hierarchical** — an administrator is not implicitly a moderator; a user can hold several. `RightService.G` defines the three named groups. Authorization has three layers: route policies (`config/policies.js`) → controller checks → business logic. See `PERMISSION_SYSTEM.md` before changing who can do what.

---

## 🛠️ Tech Stack

| Technology                                                | Usage                                          |
| --------------------------------------------------------- | ---------------------------------------------- |
| **Node.js ≥ 24**                                          | Runtime (trust `engines`; `.nvmrc` is stale)   |
| **Sails.js 1.5 / Waterline**                              | MVC framework and ORM                          |
| **PostgreSQL + PostGIS**                                  | Database, via `sails-postgresql`               |
| **Typesense**                                             | Full-text search                               |
| **pg-boss**                                               | Background job queues (CSV import, enrichment) |
| **jsonwebtoken / argon2 / otplib**                        | Auth tokens, password hashing, MFA             |
| **AWS SES v2**                                            | Email                                          |
| **Azure Blob Storage**                                    | File storage                                   |
| **dayjs**                                                 | Dates, always through `api/utils/dayjs.js`     |
| **winston**                                               | Logging (`api/utils/logger.js`)                |
| **Mocha / should / Sinon / Supertest / fast-check / nyc** | Tests                                          |

ESLint is pinned to **v8** on purpose: `eslint-config-airbnb-base` has no flat-config support. Do not upgrade it.

---

## 🏗️ Structure

```text
api/
├── controllers/v1/<domain>/<action>.js   # One Sails action per file, kebab-case (find-all.js)
├── models/                               # T* tables, H* history, J* junctions, V* views
├── services/                             # Business logic (CaveService, GeoLocService, …)
├── policies/                             # tokenAuth, validateId, …
├── responses/                            # Custom responses (ok, notFound, forbidden, …)
├── helpers/                              # Sails helpers
└── utils/                                # Pure utilities — most load without Sails
config/
├── routes.js                             # Every route, explicit (no blueprints)
├── policies.js                           # Policy per action
└── locales/                              # Server-side i18n (15 languages)
sql/                                      # Schema, triggers, views, pg_cron jobs, 9_* migrations
test/
├── bootstrap.test.js                     # Lifts Sails, restores the test DB
├── fixtures/                             # JSON fixtures loaded by Fixted
├── customSQL.js                          # Indexes/SQL the test DB needs (see below)
└── integration/{0_models,1_services,2_utils,3_helpers,4_routes,5_policies}/
docker/                                   # Local Postgres, test Postgres, Typesense, Superset
scripts/                                  # Dev setup, parallel test runner, snapshots
```

- Models and services are **globals** (`TCave`, `CaveService`, `sails`) — no `require`.
- All routes are under `/api/v1/`.
- Soft deletes use `is_deleted`; merges use `redirect_to`. Both kinds of row still exist — decide which a query should include.

---

## 🧰 Commands

```shell
npm run dev:up        # Start Postgres, test Postgres and Typesense containers
npm run dev           # Dev server with nodemon on :1337 (reloads on api/, config/)
npm run dev:clean     # Destroy and rebuild containers and volumes (after SQL changes)

npm run test                      # Parallel suite (rebuilds the DB template when stale)
npm run test -- --grep "pattern"  # Subset
npm run test:sequential           # Single process, for debugging
npm run coverage                  # Sequential, with nyc (what CI runs)

npm run lint          # ESLint (CI fails on errors)
npm run lint:fix
```

**The dev server belongs to the user.** Never start, restart or kill it. If port 1337 is taken, that is their server — use it, and run your own processes on another port.

Local databases: dev is container `grotto-postgres`, test is `grotto-postgres-test`; both databases are named `grottoce` (`grottoce_test` does not exist).

```shell
docker exec grotto-postgres psql -U root -d grottoce -c "SELECT ..."
```

---

## 🔍 Verify Before You Write

Never write code from assumptions about a record's shape, a query's result or a service's return value. Check against the running system first, at the cheapest level that answers the question:

| Question about…                   | Use                                                       |
| --------------------------------- | --------------------------------------------------------- |
| A pure function in `api/utils/`   | `node -e "console.log(require('./api/utils/x.js')(…))"`   |
| Schema, row counts, query plans   | `docker exec grotto-postgres psql …`                      |
| Endpoint status, shape, policies  | `curl -s -w "\n[%{http_code}]\n" localhost:1337/api/v1/…` |
| Services, helpers, Waterline      | A scratch script loading Sails in `.tmp/` (gitignored)    |
| Something worth keeping as a test | A targeted mocha run                                      |

Do not run the full suite to answer an exploratory question. Recipes, the scratch-script template and its pitfalls: [`docs/agents/runtime-verification.md`](docs/agents/runtime-verification.md).

---

## 📝 Code Conventions

### Controllers are thin

```javascript
module.exports = async (req, res) => {
  // 1. Validate input       → return res.badRequest(...)
  // 2. Check permissions    → return res.forbidden(...)
  // 3. Delegate to a service
  // 4. Return through ControllerService.treat / treatAndConvert
};
```

- Errors go through Sails custom responses (`res.badRequest()`, `res.notFound()`, `res.forbidden()`, `res.serverError()`).
- **Never** use raw Express responses (`res.json()`, `res.status().send()`) for success paths ([#742](https://github.com/GrottoCenter/grottocenter-api/issues/742)).
- Permission check: `RightService.hasGroup(req.token.groups, RightService.G.MODERATOR)`.
- Read boolean request params with `api/utils/readBoolParam.js` (strict `true`/`false`/`1`/`0`, structured 400 on anything else), not ad-hoc comparisons.

### Services hold the logic

Business logic lives in `api/services/`, reusable across controllers. Log and rethrow rather than swallow:

```javascript
try {
  return await SomeService.operation();
} catch (error) {
  sails.log.error(error);
  throw error;
}
```

### Data access

- Prefer Waterline over raw SQL (`CommonService.query()`); use `.populate()` with defined associations.
- Fetch only what the response needs, especially before a converter.
- Watch for N+1 queries in loops.
- `.set(obj)` / `.create(obj)` rename `obj`'s keys to column names **in place** — pass `{ ...obj }` if you reuse the object (typically as a test expectation).

### Style

- `const` / `let`, arrow functions, destructuring; no `for...in`.
- Prettier: single quotes, ES5 trailing commas, 2-space indent.
- Reuse an existing util or service before adding a new one.

---

## 🗄️ Database & SQL Migrations

- New migrations go in `sql/` as `9_<next-seq>_<date>_<description>.sql` (older files use other prefixes; `zz_ownership_and_grants.sql` runs last). Files with `mock` in the name are local seed data.
- Every migration file starts with `\c grottoce;` (`00_roles.sql` and `1_cron.sql` are deliberate exceptions).
- Make statements idempotent (`IF EXISTS` / `IF NOT EXISTS`). Drop a UNIQUE constraint with `ALTER TABLE ... DROP CONSTRAINT IF EXISTS`, not `DROP INDEX`.
- **Ownership:** the API connects as `gc_app`, which owns nothing. Every table, view, materialized view, sequence and function you create must end with `ALTER ... OWNER TO gc_owner;`. Do **not** open a migration with `SET ROLE gc_owner;` — it fails on a fresh local volume, where ownership is only transferred later by `sql/zz_ownership_and_grants.sql`.
- **Indexes:** the test DB is built by Waterline (`migrate: drop`) and never runs `sql/0_tables.sql`. Add every new `CREATE INDEX IF NOT EXISTS` to the `INDEX_OPTIMIZATION_MIGRATION` block in `test/customSQL.js` too.
- **The test suite cannot catch privilege or FK bugs.** The test container only runs `0_initDatabase.sql`: no `gc_*` roles, no foreign keys, superuser connection. After any SQL change, run `npm run dev:clean`, check `docker logs grotto-postgres` for init errors, and exercise the change against `npm run dev`.
- Materialized views are refreshed by `pg_cron` jobs inside Postgres (`sql/1_cron.sql`). A correct query against a stale view still returns stale data.
- Production does not run migrations on deploy; they are applied by hand. Say so in the PR when one is included.

---

## 📖 API Documentation

Any change to an endpoint updates `assets/swaggerV1.yaml` (OpenAPI 3.0) in the same PR:

- Path and method match `config/routes.js`.
- Parameters, body and response schemas match the controller's real output.
- Security matches `config/policies.js`.
- Error responses (400, 401, 403, 404, 500) are documented.

---

## 🧪 Testing

Every change ships with tests. A bug fix starts with a failing test that reproduces it.

- New or changed endpoints: `test/integration/4_routes/`. Business logic: `1_services/`. Utils: `2_utils/`.
- New data goes in `test/fixtures/`.
- `describe()` callbacks are **always** arrow functions (`func-names` lint error otherwise). Use `function` only when the body needs `this.timeout()`; otherwise chain `.timeout()`.
- Stub with Sinon and restore after each test. **Require the service inside a `before` hook**, not at the top of the file: Sails re-requires `api/` when it lifts, so a top-level `require` (or the global) can be a different object from the one controllers call, and the stub silently never fires. Check `stub.callCount` when a stubbed test misbehaves.
- Property-based tests (`fast-check`, `*.property.test.js`) are for pure functions and stubbed service logic only — **never** with `supertest`, and never over a boolean or single-value input. Rules for arbitraries and properties: [`docs/agents/property-testing.md`](docs/agents/property-testing.md).

### Running

- The parallel runner shards by folder; each shard clones the `grottoce_template` database. Shard output goes to `test/shard-N.tmp`.
- While the dev server holds 1337, run targeted tests on another port:

  ```shell
  npx cross-env NODE_ENV=test PORT=1350 mocha --exit \
    test/bootstrap.test.js "test/integration/2_utils/*.test.js"
  ```

  `test/bootstrap.test.js` must always come first.

- The full suite is intermittently flaky under shard contention (rate-limiter socket hang-ups cascading into timeouts). Before blaming your change, re-run the failing tests in isolation and compare with a clean `develop`.

---

## 🔀 Git Workflow

- Branch from an updated `develop`: `<type>/<issue>-<slug>` (e.g. `fix/1857-health-503`), or `<type>/<slug>` when there is no issue.
- Conventional commits with a **required** camelCase or PascalCase scope: `fix(massif): …`, `feat(rateLimit): …`. Types: `feat`, `fix`, `tech`, `refactor`, `improvement`, `chore`, `docs`, `style`, `test`, `revert`. Reference the issue as `(#1234)` at the end of the subject.
- **Never** commit with `--no-verify`; lint-staged and commitlint must run.
- Never amend or rewrite a pushed commit without `--force-with-lease`.
- PRs target `develop` and follow `.github/pull_request_template.md`. Use the `github-workflow` skill to open one.
- **A merge into `develop` is a production release.** `.github/workflows/deploy.yml` deploys every push to `develop`; there is no staging slot.

---

## 🤖 Skills & On-Demand Docs

Procedures live in `.agents/skills/<name>/SKILL.md` (exposed to Claude Code through the `.claude/skills` symlink). Read the matching one before doing the task:

| Skill             | Use it to                                           |
| ----------------- | --------------------------------------------------- |
| `github-workflow` | Branch, commit and open a PR, including stacked PRs |
| `pr-review`       | Review a PR and post inline comments on GitHub      |
| `fix-review`      | Address reviewer feedback on an existing PR         |

Read these only when the task touches the topic:

| Doc                                                                          | When                                  |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| [`docs/agents/runtime-verification.md`](docs/agents/runtime-verification.md) | Exploring data, services or endpoints |
| [`docs/agents/property-testing.md`](docs/agents/property-testing.md)         | Writing fast-check tests              |
| [`docs/agents/dependency-upgrade.md`](docs/agents/dependency-upgrade.md)     | Upgrading npm dependencies            |
| [`docker/superset/README.md`](docker/superset/README.md)                     | Touching `docker/superset/**`         |
| [`docs/snapshot-types.md`](docs/snapshot-types.md)                           | Entrance snapshot history             |

Production hosting and incident triage are documented in the maintainers' private infrastructure repository, not here.
