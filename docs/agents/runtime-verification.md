# Runtime Verification

Never write code based on assumptions about what a service returns, what shape a Waterline record has, or what a SQL query produces. Check the running system first.

A Sails app takes about 8 seconds to load per process, so the discipline is: pick the cheapest surface that can answer the question, and actually run it before committing to a design.

When a code comment documents query behavior, performance or data shapes, state the observed result (row counts, timings, edge-case behavior). Do not write "verified at runtime"; that is assumed.

## Choosing a surface

Escalate only as far as the question requires. Each tier costs roughly 10× the one above it.

| Surface                       | Cost    | Use for                                                |
| ----------------------------- | ------- | ------------------------------------------------------ |
| `node -e` require             | instant | Pure functions in `api/utils/`                         |
| `docker exec psql`            | instant | Schema, row counts, `EXPLAIN ANALYZE`, view freshness  |
| `curl` against the dev server | instant | Status codes, response shape, policies                 |
| Scratch script (`sails.load`) | ~8s     | Services, helpers, Waterline, anything needing globals |
| Targeted mocha run            | ~15s+   | Assertions you intend to keep as tests                 |
| `npm run test`                | minutes | Regression check before presenting work                |

## 1. Pure functions

Most of `api/utils/` has no Sails dependency:

```shell
node -e "const c = require('./api/utils/coerceToInt.js'); console.log(c('42'), c('abc'), c(null));"
```

Try `null`, `undefined`, `''`, `NaN`, `Infinity`, negatives and very long strings here, before writing the function into a file and long before writing a property test. A module that touches `sails` or a model at require time will throw — move to a scratch script.

## 2. Database

```shell
docker exec grotto-postgres psql -U root -d grottoce -c "SELECT ..."        # dev
docker exec grotto-postgres-test psql -U root -d grottoce -c "SELECT ..."   # test
```

Use `-t` for tuples only. Check before designing, not after implementing:

- **Real IDs** — look up an actual row; never assume `id = 1`.
- **Cardinality** — tells you whether a query needs an index or pagination.
- **`EXPLAIN ANALYZE`** — before claiming anything about performance.
- **Materialized view freshness** — `pg_matviews`, and compare against the base tables.
- **Column types and nullability** — Waterline definitions drift from the real schema.

The test container also holds `grottoce_template`, the database the parallel runner clones per shard. Inspect it to see what fixtures actually produce instead of inferring from `test/fixtures/*.json`.

## 3. The dev server

`npm run dev` runs nodemon on `api/`, `config/` and `app.js`, so an already running server reflects your edits without a reload cost.

```shell
curl -s -w "\n[%{http_code}]\n" "http://localhost:1337/api/v1/massifs/4/statistics"
```

Always add `-w "\n[%{http_code}]\n"`: a 404 with a JSON body otherwise looks like success.

Typesense:

```shell
curl -s http://localhost:8108/collections -H "X-TYPESENSE-API-KEY: localhost_typesense_api_key"
```

Collection names are timestamp-suffixed (`caves_1785974975368`); read the live name. `num_documents` tells you whether the index is populated.

The user owns the dev server. Do not start, restart or kill it.

## 4. Scratch scripts

For services, helpers and models, load Sails in `.tmp/scratch.js`. `.tmp/` is gitignored and ESLint-ignored, so nothing leaks into a commit.

```javascript
const sails = require('sails');

sails.load(
  {
    hooks: { http: false, sockets: false, pubsub: false, views: false },
    log: { level: 'error' },
  },
  async (err) => {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    try {
      console.log('caves:', await TCave.count());
      const r = await CommonService.query(
        'SELECT count(*) AS n FROM t_entrance',
        []
      );
      console.log('sql:', r.rows[0]);
      console.log('svc keys:', Object.keys(StatisticsMassifService));
    } catch (e) {
      console.error('ERR', e.message);
    }
    return sails.lower(() => process.exit(0));
  }
);
```

```shell
node .tmp/scratch.js
```

Each of these causes a failure when skipped:

- **`views: false` whenever `http: false`** — the views hook depends on http (`E_HOOKINIT_DEP`).
- **`sails.load`, not `sails.lift`** — lifting binds port 1337.
- **Keep the script inside the repo** — `require('sails')` resolves against `node_modules`.
- **Always `sails.lower(() => process.exit(0))`** — Waterline holds pool connections open.
- **Wrap the body in try/catch** — an unhandled rejection skips `lower()`.

To target the test database, run with `NODE_ENV=test` and add:

```javascript
const sailsPostgresql = require('sails-postgresql');
// in the load config:
datastores: {
  default: {
    adapter: sailsPostgresql,
    url: 'postgres://root:root@localhost:5432/grottoce',
  },
},
models: { migrate: 'safe' },
```

Never use `migrate: 'drop'` in a scratch script; it destroys the database you are inspecting. Delete the script once the question is answered.

`npx sails console --dontLift --silent` gives an interactive REPL, but piped input comes back interleaved with output, so prefer a scratch script for automated use.

## 5. Targeted tests

```shell
npx cross-env NODE_ENV=test PORT=1350 mocha --exit \
  test/bootstrap.test.js "test/integration/2_utils/*.test.js"
```

- A free `PORT` is required while the dev server holds 1337. Without it the bootstrap fails with `EADDRINUSE` after restoring the template, which looks like a database problem.
- `test/bootstrap.test.js` always comes first.
- Or filter through the parallel runner: `npm run test -- --grep "pattern"`.

## Before designing a change

- Enumerate what exists: `Object.keys(SomeService)`, `Object.keys(sails.helpers)`, `sails.config.routes`. Waterline adds `identity`, `globalId` and `sails` to every service; ignore those.
- Check the data model in the database, not only in `api/models/`.
- Run the real query and look at what `.populate()` returns and omits.
- Write down constraints you found (missing indexes, stale views, soft-delete semantics) as design inputs.

## Common gotchas

- **`is_deleted` and `redirect_to`** — soft-deleted and merged rows still exist.
- **Stale materialized views** — check freshness before blaming the query.
- **Test indexes differ from dev** — see `test/customSQL.js`.
- **Waterline and raw SQL counts diverge** — `TCave.count()` applies model scoping a hand-written `count(*)` does not.
- **Dependencies need a restart** — nodemon does not watch `node_modules`; after `npm install` the user must restart `npm run dev`.
