-- Cluster-level role definitions.
--
-- DELIBERATELY NO `\c grottoce;`.  This file sorts before 0_initDatabase.sql
-- ('0' < '_' in the C locale, which is the order the Docker entrypoint uses),
-- so the grottoce database does not exist yet when this runs.  Roles are
-- cluster-wide objects, so the connected database is irrelevant here.  Anything
-- that is per-database — ownership, grants, default privileges — lives in
-- zz_ownership_and_grants.sql instead.
--
-- This file contains no secrets and is safe to apply verbatim in any
-- environment: new login roles are created with PASSWORD NULL, which cannot
-- authenticate.  Development passwords are set separately in
-- 3_00_dev_role_passwords.sql, which the `3_` prefix already marks as dev-only
-- (see README.md).
--
-- Re-runnable.  Each role is created only if absent, then its attributes are
-- converged with an unconditional ALTER ROLE.  The ALTER statements never
-- mention PASSWORD, so re-applying this file against an environment where the
-- passwords have been set does not wipe them.

-- ---------------------------------------------------------------------------
-- The roles
-- ---------------------------------------------------------------------------
--
--   gc_owner         NOLOGIN group. Owns every application object. No password,
--                    so there is nothing to rotate or leak. Used via SET ROLE.
--   gc_app           Login role for the API (Waterline + pg-boss). DML on
--                    schema public, owner of schema pgboss, nothing else.
--   gc_readonly      NOLOGIN group. SELECT only, and deliberately no access to
--                    schema pgboss, whose job.data column holds raw CSV import
--                    payloads and user-supplied geocoding data.
--   gc_superset_ro   Login role for Superset's reporting connection.
--   gc_superset_meta Login role owning the Superset metadata database.
--
-- gc_app is deliberately NOT a member of gc_owner.  Inheritance would make
-- every privilege boundary below cosmetic.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_owner') THEN
    CREATE ROLE gc_owner NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_readonly') THEN
    CREATE ROLE gc_readonly NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_app') THEN
    CREATE ROLE gc_app LOGIN PASSWORD NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_superset_ro') THEN
    CREATE ROLE gc_superset_ro LOGIN PASSWORD NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_superset_meta') THEN
    CREATE ROLE gc_superset_meta LOGIN PASSWORD NULL;
  END IF;
END
$$;

-- Attributes are converged separately from creation so that this file repairs
-- drift instead of silently skipping an existing role.  Spelling out the
-- negatives is the point of the file: it documents what these roles must never
-- acquire, and undoes it if someone grants it by hand.
ALTER ROLE gc_owner
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION INHERIT;

ALTER ROLE gc_readonly
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION INHERIT;

ALTER ROLE gc_app
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION INHERIT;

-- CONNECTION LIMIT 5 is not hygiene theatre: the App Service Plan is a single
-- B2 Basic worker shared with Superset, and the database is a Standard_B2s
-- Burstable instance in another region.  A runaway BI query is a production
-- incident.
ALTER ROLE gc_superset_ro
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION INHERIT
  CONNECTION LIMIT 5;

-- Superset runs Alembic migrations at container start, so this role needs full
-- DDL — but only inside the superset_meta database, which it will own.  It gets
-- no rights at all in grottoce.
ALTER ROLE gc_superset_meta
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION INHERIT;

-- ---------------------------------------------------------------------------
-- The stub that makes zz_ownership_and_grants.sql portable
-- ---------------------------------------------------------------------------
--
-- In production `grottoce` is the Azure Flexible Server administrator login: it
-- already exists, owns every application object today, and is the role pg_cron
-- jobs and `sql/9_*` migrations run as.  Locally it does not exist at all — the
-- container superuser is `root`.
--
-- Creating a harmless NOLOGIN placeholder locally is what lets
-- zz_ownership_and_grants.sql be byte-identical between a laptop and
-- production, which is the entire point of rehearsing it on every
-- `npm run dev:clean`.
--
-- Note the asymmetry with the roles above: there is no ALTER ROLE grottoce
-- anywhere in this file.  Converging the attributes of a managed Azure
-- administrator login is not ours to do, and NOLOGIN would lock it out.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'grottoce') THEN
    CREATE ROLE grottoce NOLOGIN;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
--
-- This GRANT is load-bearing, not cosmetic.  Ownership checks in PostgreSQL go
-- through has_privs_of_role(), which inherited membership satisfies.  The
-- pg_cron jobs in 1_cron.sql run REFRESH MATERIALIZED VIEW CONCURRENTLY as
-- grottoce, and REFRESH requires ownership, which cannot be granted.  Without
-- this membership, moving the matviews to gc_owner breaks all four cron jobs.
--
-- It is also the rollback hinge: REASSIGN OWNED BY gc_owner TO grottoce undoes
-- the whole ownership migration, catalog-only.
--
-- INHERIT TRUE is spelled out because PostgreSQL 16 records inheritance per
-- grant rather than per role, and the default is taken from the member role's
-- own INHERIT attribute at GRANT time.  Nothing here should depend on that.
GRANT gc_owner TO grottoce WITH INHERIT TRUE;

GRANT gc_readonly TO gc_superset_ro WITH INHERIT TRUE;

-- ---------------------------------------------------------------------------
-- Per-role settings
-- ---------------------------------------------------------------------------
--
-- Only login roles get these.  ALTER ROLE ... SET is applied when a session
-- starts, for the role that authenticated; SET ROLE does not re-apply it.  So
-- settings on gc_owner or gc_readonly would never take effect and are omitted
-- rather than left as decoration.

ALTER ROLE gc_app SET search_path = public;
-- Bounds how long the API can make a schema change or a matview refresh wait.
-- A web request that has already waited ten seconds on a lock has failed
-- anyway; better a clear error than a pile-up.
ALTER ROLE gc_app SET lock_timeout = '10s';
-- Stops an abandoned transaction from holding locks indefinitely.  Generous on
-- purpose: import and enrichment work interleaves external HTTP calls with
-- queries, so a transaction can legitimately sit idle for a while.
ALTER ROLE gc_app SET idle_in_transaction_session_timeout = '5min';
-- Deliberately no statement_timeout for gc_app.  CSV imports and observation
-- imports issue legitimately long-running statements, and there is no value
-- that is both safe for them and tight enough to be useful.

ALTER ROLE gc_superset_ro SET search_path = public;
ALTER ROLE gc_superset_ro SET default_transaction_read_only = on;
ALTER ROLE gc_superset_ro SET statement_timeout = '120s';
ALTER ROLE gc_superset_ro SET lock_timeout = '5s';
ALTER ROLE gc_superset_ro SET idle_in_transaction_session_timeout = '60s';
