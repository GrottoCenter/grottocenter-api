\c grottoce;

-- Development passwords for the roles created in 00_roles.sql.
--
-- The `3_` prefix already means "development only" in this directory (see
-- README.md), so the production procedure simply never applies 3_* files.  That
-- is the whole reason these three lines live in their own file instead of next
-- to the CREATE ROLE statements: 00_roles.sql and zz_ownership_and_grants.sql
-- can then be applied verbatim in production without carrying a secret.
--
-- These values are throwaway and match the role names, exactly like the
-- existing root/root local credentials.  config/datastores.js uses gc_app to
-- connect, so a missing GRANT fails on a laptop instead of in production.
--
-- The `\c grottoce;` is here only to follow the repository convention for
-- migration files; ALTER ROLE is cluster-wide and does not need it.

ALTER ROLE gc_app PASSWORD 'gc_app';
ALTER ROLE gc_superset_ro PASSWORD 'gc_superset_ro';
ALTER ROLE gc_superset_meta PASSWORD 'gc_superset_meta';
