\c grottoce;

-- Object ownership and privileges for the roles created in 00_roles.sql.
--
-- WHY `zz_`: this file must run last, after every table, view, matview,
-- sequence, function and type exists.  The Docker entrypoint sorts filenames in
-- the C locale, where '9' < '_' — verified with `LC_ALL=C sort`, in which
-- `999_grants.sql` still sorts *before* `99_refresh_views.sql`.  No numeric
-- prefix can be made to sort last, so a letter prefix is the only option.
--
-- WHY OWNERSHIP AND GRANTS ARE IN ONE FILE: this is the only genuinely risky
-- statement set in the role separation, and it is identical in development and
-- in production.  Keeping it as a single file means it is rehearsed on every
-- `npm run dev:clean` instead of existing only as a runbook step that has never
-- been executed before the day it matters.
--
-- Everything here is idempotent and safe to re-run.  Ownership changes are
-- catalog-only — no table rewrite — and take a brief ACCESS EXCLUSIVE lock per
-- object.  A partial run leaves mixed ownership, which still works because
-- grottoce inherits gc_owner, so the remedy is always just to run it again.
--
-- Rollback for the whole file: REASSIGN OWNED BY gc_owner TO grottoce, also
-- catalog-only.

-- Fail fast rather than queueing behind a live query: without lock_timeout this
-- block can sit waiting on an ACCESS EXCLUSIVE lock while requests pile up
-- behind it.
SET lock_timeout = '5s';
SET statement_timeout = '120s';

-- ---------------------------------------------------------------------------
-- Schema pgboss must exist before pg-boss connects
-- ---------------------------------------------------------------------------
--
-- pg-boss issues `CREATE SCHEMA IF NOT EXISTS pgboss` on its install path
-- (node_modules/pg-boss/dist/plans.js).  Unlike CREATE TABLE IF NOT EXISTS,
-- that statement checks CREATE on the *database* before it checks whether the
-- schema exists, so it fails with "permission denied for database grottoce"
-- even when the schema is already there.  Verified against PostgreSQL 16.
--
-- Rather than grant gc_app CREATE on the database — which would let it create
-- arbitrary schemas — the schema is created here and pg-boss is configured with
-- `createSchema: false` in api/services/EnrichmentQueueService.js.
--
-- In production the schema already exists (holding a version 38 install), so
-- this is a no-op there and the ownership pass below moves it to gc_app.
CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION gc_app;

-- ---------------------------------------------------------------------------
-- Ownership
-- ---------------------------------------------------------------------------
--
-- Two passes, because the two schemas need different owners:
--
--   public → gc_owner   Application objects. A NOLOGIN group with no password,
--                       so there is nothing to rotate or leak. grottoce is a
--                       member with INHERIT TRUE, which is what keeps the
--                       pg_cron REFRESH MATERIALIZED VIEW CONCURRENTLY jobs
--                       passing their ownership check — REFRESH requires
--                       ownership and ownership cannot be granted.
--
--   pgboss → gc_app     Owning the schema does not own the tables in it. The
--                       next pg-boss schema migration runs as gc_app and would
--                       fail with "must be owner of table job" if the 12
--                       relations stayed behind.
--
-- Deliberately not `REASSIGN OWNED BY grottoce TO gc_owner`: that would sweep up
-- extension-owned objects (PostGIS alone contributes 745 functions), objects in
-- other schemas, and objects in other databases owned by the same role.
--
-- The loop filters on the *current* owner rather than on a specific one, so the
-- same file converges from any starting point — in development the objects start
-- out owned by the container superuser `root`, in production by `grottoce`.
--
-- Four filters are load-bearing, each one verified rather than assumed:
--
--   1. Extension-owned objects are excluded via pg_depend.deptype = 'e'. You
--      neither want nor can own PostGIS's objects.
--   2. Sequences linked to a table column (pg_depend deptype 'a' or 'i') are
--      skipped: ALTER SEQUENCE OWNER on one fails outright with "cannot change
--      owner of sequence ... is linked to table", and ALTER TABLE OWNER on the
--      parent already recurses to them.
--   3. The pg_type pass needs typrelid = 0. Of the 137 app-owned entries in
--      pg_type, 136 are table row types, which cannot be re-owned directly
--      ("t_cave is a table's row type / HINT: Use ALTER TABLE instead") and
--      follow their table anyway. Exactly one is a real standalone type.
--   4. Partitions are altered individually. ALTER TABLE OWNER on a partitioned
--      parent does *not* recurse to its partitions; t_measurement has 28. They
--      are relkind 'r', so the relation loop already covers them.
DO $$
DECLARE
  spec record;
  obj record;
  moved integer;
BEGIN
  FOR spec IN
    SELECT *
    FROM (VALUES ('public', 'gc_owner'), ('pgboss', 'gc_app')) AS t(nsp, new_owner)
  LOOP
    moved := 0;

    -- The schema itself.
    IF EXISTS (
      SELECT 1 FROM pg_namespace n
      WHERE n.nspname = spec.nsp
        AND pg_get_userbyid(n.nspowner) <> spec.new_owner
    ) THEN
      EXECUTE format('ALTER SCHEMA %I OWNER TO %I', spec.nsp, spec.new_owner);
      moved := moved + 1;
    END IF;

    -- Relations: tables, partitioned tables, sequences, views, materialized
    -- views, foreign tables. Indexes and TOAST tables follow their table.
    FOR obj IN
      SELECT c.relname, c.relkind
      FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = spec.nsp
        AND c.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
        AND pg_get_userbyid(c.relowner) <> spec.new_owner
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.classid = 'pg_class'::regclass
            AND d.objid = c.oid
            AND d.deptype = 'e'
        )
        AND (
          c.relkind <> 'S'
          OR NOT EXISTS (
            SELECT 1 FROM pg_depend d
            WHERE d.classid = 'pg_class'::regclass
              AND d.objid = c.oid
              AND d.refclassid = 'pg_class'::regclass
              AND d.deptype IN ('a', 'i')
          )
        )
      ORDER BY c.relkind, c.relname
    LOOP
      EXECUTE format(
        'ALTER %s %I.%I OWNER TO %I',
        CASE obj.relkind
          WHEN 'S' THEN 'SEQUENCE'
          WHEN 'v' THEN 'VIEW'
          WHEN 'm' THEN 'MATERIALIZED VIEW'
          WHEN 'f' THEN 'FOREIGN TABLE'
          ELSE 'TABLE'
        END,
        spec.nsp, obj.relname, spec.new_owner
      );
      moved := moved + 1;
    END LOOP;

    -- Routines. ALTER ROUTINE covers functions and procedures; aggregates need
    -- their own keyword.
    FOR obj IN
      SELECT p.proname, p.prokind, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = spec.nsp
        AND pg_get_userbyid(p.proowner) <> spec.new_owner
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.classid = 'pg_proc'::regclass
            AND d.objid = p.oid
            AND d.deptype = 'e'
        )
      ORDER BY p.proname
    LOOP
      EXECUTE format(
        'ALTER %s %I.%I(%s) OWNER TO %I',
        CASE obj.prokind WHEN 'a' THEN 'AGGREGATE' ELSE 'ROUTINE' END,
        spec.nsp, obj.proname, obj.args, spec.new_owner
      );
      moved := moved + 1;
    END LOOP;

    -- Standalone types. Row types (typrelid <> 0), auto-generated array and
    -- multirange types, and pseudo-types all follow something else.
    FOR obj IN
      SELECT t.typname, t.typtype
      FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = spec.nsp
        AND t.typrelid = 0
        AND t.typtype NOT IN ('m', 'p')
        AND NOT EXISTS (SELECT 1 FROM pg_type b WHERE b.typarray = t.oid)
        AND pg_get_userbyid(t.typowner) <> spec.new_owner
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.classid = 'pg_type'::regclass
            AND d.objid = t.oid
            AND d.deptype = 'e'
        )
      ORDER BY t.typname
    LOOP
      EXECUTE format(
        'ALTER %s %I.%I OWNER TO %I',
        CASE obj.typtype WHEN 'd' THEN 'DOMAIN' ELSE 'TYPE' END,
        spec.nsp, obj.typname, spec.new_owner
      );
      moved := moved + 1;
    END LOOP;

    RAISE NOTICE 'schema %: % object(s) moved to %', spec.nsp, moved, spec.new_owner;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Take away the implicit privileges
-- ---------------------------------------------------------------------------
--
-- A database with a NULL datacl carries the built-in default, where PUBLIC holds
-- CONNECT and TEMPORARY — i.e. every role that exists can connect. Revoking is
-- what makes CONNECT an explicit grant; TEMPORARY is re-granted to gc_app below
-- because this strips it.
REVOKE ALL ON DATABASE grottoce FROM PUBLIC;

-- Schema public carries the pre-PostgreSQL-15 layout on this cluster: its ACL
-- grants PUBLIC both USAGE and CREATE. Any later "revoke CREATE from the app
-- role" step is a silent no-op while every role inherits CREATE from PUBLIC
-- anyway, so this line is a prerequisite for that work rather than part of it.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Deliberately NOT extended to table or routine level. PostGIS grants PUBLIC
-- SELECT on spatial_ref_sys, geography_columns and geometry_columns, and
-- ST_Transform needs it. A database-level REVOKE leaves those table ACLs alone,
-- which is the intent.

-- ---------------------------------------------------------------------------
-- gc_app — the API's role
-- ---------------------------------------------------------------------------
--
-- What it gets: connect, DML on schema public, sequence usage, execute on the
-- application's own routines, and ownership of schema pgboss.
--
-- What it deliberately does not get: SUPERUSER, CREATEDB, CREATEROLE, BYPASSRLS,
-- REPLICATION, CREATE on schema public, membership in gc_owner or
-- azure_pg_admin, or any access to the postgres and superset_meta databases.
--
-- CREATE ON SCHEMA public is absent because nothing in the API issues DDL any
-- more. PartitionManager was the last one, and it now goes through
-- gc_ensure_measurement_partition() — see
-- sql/9_21_2026_09_29_measurement_partition_function.sql. Waterline runs with
-- `migrate: 'safe'` in every environment, so it never emits DDL either.
-- TEMPORARY is granted at database level and is what keeps pg_temp usable
-- without CREATE on the schema.
GRANT CONNECT, TEMPORARY ON DATABASE grottoce TO gc_app;
GRANT USAGE ON SCHEMA public TO gc_app;

-- Not the same thing as dropping CREATE from the line above. GRANT is not a
-- diff: on a database where an earlier revision of this file already granted
-- CREATE, narrowing the grant leaves the privilege sitting in nspacl. The
-- REVOKE is what makes fresh and existing installations converge, and it is a
-- harmless no-op where the grant was never made.
REVOKE CREATE ON SCHEMA public FROM gc_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gc_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gc_app;

-- gc_app owns schema pgboss, and an owner's implicit rights are enough, but
-- spelling the grant out means a hand-edited nspacl cannot quietly lock the
-- queue out.
GRANT USAGE, CREATE ON SCHEMA pgboss TO gc_app;

-- EXECUTE on the application's own routines, granted explicitly so that a later
-- `REVOKE EXECUTE ... FROM PUBLIC` cannot break the h_* history triggers.
-- Restricted to non-extension routines on purpose: PUBLIC already holds EXECUTE
-- on the 745 PostGIS and 7 unaccent routines in this schema, that grant is not
-- being revoked, and copying it to gc_app would add 752 ACL entries that say
-- nothing.
DO $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
    ORDER BY p.proname
  LOOP
    -- ROUTINE with no prokind branching: unlike ALTER, GRANT has no AGGREGATE
    -- variant, and GRANT EXECUTE ON ROUTINE accepts functions, procedures and
    -- aggregates alike.
    EXECUTE format(
      'GRANT EXECUTE ON ROUTINE public.%I(%s) TO gc_app',
      obj.proname, obj.args
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- gc_readonly — the group behind the BI and developer read roles
-- ---------------------------------------------------------------------------
--
-- No access to schema pgboss, deliberately: pgboss.job.data holds raw CSV import
-- payloads and user-supplied geocoding data.
--
-- No EXECUTE grants either — PUBLIC still holds EXECUTE on the PostGIS routines
-- a reporting query needs, and nothing above revokes it.
GRANT CONNECT ON DATABASE grottoce TO gc_readonly;
GRANT USAGE ON SCHEMA public TO gc_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gc_readonly;

-- ---------------------------------------------------------------------------
-- Default privileges for objects that do not exist yet
-- ---------------------------------------------------------------------------
--
-- The most important statements in this file, because no migration runner
-- enforces them. Without these, every future `sql/9_*` table is invisible to the
-- API — a production break that surfaces as a 500 long after the migration
-- looked successful.
--
-- Both roles are listed because FOR ROLE X only covers objects created *by* X.
-- gc_owner covers migrations that remember `SET ROLE gc_owner;`, grottoce covers
-- the ones that do not.
--
-- `root` is deliberately absent, even though local migrations run as root. A
-- migration written without `SET ROLE gc_owner;` should create a table the dev
-- server cannot read: that failure is the signal that the migration is wrong.
--
-- Note the gap this cannot close: views, materialized views and routines are not
-- covered by ALTER DEFAULT PRIVILEGES for ownership purposes, so `SET ROLE
-- gc_owner;` at the top of a migration remains the only real protection for
-- them.
ALTER DEFAULT PRIVILEGES FOR ROLE gc_owner, grottoce IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gc_app;
ALTER DEFAULT PRIVILEGES FOR ROLE gc_owner, grottoce IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO gc_app;
ALTER DEFAULT PRIVILEGES FOR ROLE gc_owner, grottoce IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO gc_app;

ALTER DEFAULT PRIVILEGES FOR ROLE gc_owner, grottoce IN SCHEMA public
  GRANT SELECT ON TABLES TO gc_readonly;

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
--
-- Expected in production: 192 relations in public (125 r, 1 p, 59 S, 5 m, 2 v)
-- owned by gc_owner, and 12 in pgboss owned by gc_app.
--
--   SELECT n.nspname, pg_get_userbyid(c.relowner) AS owner, c.relkind, count(*)
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname IN ('public', 'pgboss')
--     AND c.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
--   GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
