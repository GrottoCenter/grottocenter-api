# Database management, migrations and mock data

The SQL files of Grottocenter are divided in 5 categories:

- **prefix 00\_** :arrow_right: cluster-level roles, created before any database exists
- **prefix 0\_** :arrow_right: files creating the "base" tables & triggers
- **prefix 1\_** :arrow_right: files updating the tables & triggers (by adding / deleting columns for example)
- **prefix 2\_** :arrow_right: files populating (or seeding) the database with fixed values needed in Grottocenter (ex: document types, languages, countries...)
- **prefix 3\_** :arrow_right: files seeding fake data for development only
- **prefix 4\_** :arrow_right: file updating the PostGreSQL auto incrementing sequences
- **prefix zz\_** :arrow_right: object ownership, privileges and default privileges — must run last

If you need to update something in the database to make your feature working, then be sure to create the appropriate migration file (**prefix 1\_**) nor seeding file (**prefix 2\_**). Eventually, you will also need to update _mock_data.sql_ to provide fake data to the other developers.

# Database roles

The API does not connect as the schema owner. Three files set that up, and the Docker
entrypoint runs them in the right order on its own:

| File | Applies in production? | What it does |
| --- | --- | --- |
| `00_roles.sql` | yes, verbatim | Creates `gc_owner`, `gc_app`, `gc_readonly`, `gc_superset_ro`, `gc_superset_meta` with `PASSWORD NULL`. Holds no secrets. |
| `3_00_dev_role_passwords.sql` | **no** — `3_` means development only | Sets throwaway passwords equal to the role names. |
| `zz_ownership_and_grants.sql` | yes, verbatim | Moves every object in `public` to `gc_owner` and schema `pgboss` to `gc_app`, then grants. Idempotent; re-run it any time. |

`config/datastores.js` connects as `gc_app`, so **a missing `GRANT` fails on a laptop
instead of in production.** The test suite deliberately stays on the superuser
(`test/test-config.js`): the test container only mounts `0_initDatabase.sql`, so the
roles do not exist there, and the test suite is not the place that catches privilege
regressions.

## Writing a migration now that objects are owned by `gc_owner`

Anything a `9_*` file creates in `public` must end up owned by `gc_owner`, or the API
will not be able to read it. Two ways, and the difference matters:

```sql
-- In production, where gc_owner owns schema public: works.
SET ROLE gc_owner;
CREATE TABLE t_thing (...);
```

```sql
-- Works everywhere, including a freshly initialised local volume, where schema
-- public is still owned by pg_database_owner and gc_owner has no CREATE on it
-- until zz_ownership_and_grants.sql runs — which is *after* every 9_* file.
CREATE TABLE t_thing (...);
ALTER TABLE t_thing OWNER TO gc_owner;
```

On a local rebuild `zz_ownership_and_grants.sql` re-owns whatever you got wrong, so a
mistake here shows up in production and not on your laptop. Prefer the second form.
`ALTER DEFAULT PRIVILEGES` covers grants on new tables, sequences and functions, but
**not** ownership, and not views or materialized views at all.

## Applying the role files to an existing local volume

The entrypoint only fires on an empty volume. Either `npm run dev:clean`, or apply them
by hand:

```bash
docker exec grotto-postgres psql -U root -d root -v ON_ERROR_STOP=1 \
  -f /docker-entrypoint-initdb.d/00_roles.sql
docker exec grotto-postgres psql -U root -d root -v ON_ERROR_STOP=1 \
  -f /docker-entrypoint-initdb.d/3_00_dev_role_passwords.sql
docker exec grotto-postgres psql -U root -d root -v ON_ERROR_STOP=1 \
  -f /docker-entrypoint-initdb.d/zz_ownership_and_grants.sql
```

To undo the ownership move: `REASSIGN OWNED BY gc_owner TO root` (catalog-only, no
table rewrite).

# TODO

- Seeding files (2\_) need to be updated (they are not complete)
