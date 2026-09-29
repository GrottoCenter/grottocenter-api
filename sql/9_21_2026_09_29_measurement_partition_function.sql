\c grottoce;

-- A privileged wrapper so the API can add t_measurement partitions without
-- owning the table.
--
-- WHY: observation imports call PartitionManager.ensurePartitions() inside the
-- import transaction, which issued `CREATE TABLE ... PARTITION OF t_measurement`
-- directly.  PostgreSQL checks that with pg_class_ownercheck, so it only ever
-- worked because the API connected as the role that owns every application
-- object.  Once the API connects as gc_app the statement fails with "must be
-- owner of table t_measurement" — verified, and only for a quarter that does
-- not exist yet: `CREATE TABLE IF NOT EXISTS` short-circuits on the existence
-- check before the ownership check, so an import into an existing quarter keeps
-- working.  Partitions currently run out at 2027-01-01.
--
-- SECURITY DEFINER is what closes the gap: the function runs as its owner,
-- gc_owner, which does own t_measurement.  gc_app gets EXECUTE on this one
-- function instead of ownership of the table.
--
-- WHY THERE IS NO `ALTER FUNCTION ... OWNER TO gc_owner` HERE, AND MUST NOT BE:
-- SECURITY DEFINER runs the function as its owner, so the owner has to be
-- whoever owns t_measurement at the time — and that changes.  Leaving the owner
-- as the role that applied the file is what makes the deployment ordering safe in
-- both directions:
--
--   * applied in production before ownership moves, the owner is the
--     administrator role, which still owns t_measurement — the function works
--     the moment it exists, so the PartitionManager change can ship immediately;
--   * zz_ownership_and_grants.sql then re-owns it to gc_owner along with every
--     other routine in public, at which point gc_owner owns t_measurement too,
--     so it keeps working with no edit;
--   * on a local rebuild it is created by the container superuser and re-owned
--     by the same pass, because zz_ runs after every 9_* file.
--
-- Pinning the owner to gc_owner here would instead break the production window
-- between this file and zz_: membership runs the wrong way for that (the
-- administrator is a member of gc_owner, not the reverse), so a gc_owner-owned
-- function cannot create a partition of an administrator-owned table.
--
-- Deliberately a thin wrapper, not a reimplementation.  Partition names and
-- boundaries stay derived in PartitionManager.js, where they are unit- and
-- property-tested; this function only validates what it is handed.  The
-- validation is what makes a SECURITY DEFINER function safe to expose: the name
-- regex bounds it to t_measurement partitions, and the boundary checks stop a
-- caller bug from carving the table into something other than whole quarters.
--
-- WHY NO `SET ROLE gc_owner;` EITHER: on a freshly initialised PostgreSQL 16
-- cluster, schema public is owned by pg_database_owner and PUBLIC holds only
-- USAGE, so gc_owner cannot create anything in it until
-- zz_ownership_and_grants.sql transfers the schema — which runs after every 9_*
-- file on a local rebuild.  `SET ROLE gc_owner;` here fails with "permission
-- denied for schema public" on a clean volume, even though it would work in
-- production, whose schema public still carries the pre-15 layout that grants
-- PUBLIC CREATE.  Rehearsing on a clean volume is what caught that.

CREATE OR REPLACE FUNCTION gc_ensure_measurement_partition(
  p_name  text,
  p_start date,
  p_end   date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
-- search_path is pinned because the function runs with gc_owner's privileges:
-- without it, a caller could shadow pg_class or format() from a schema of its
-- own.  timezone is pinned because the date -> timestamptz coercion below is
-- session-dependent, and a partition boundary that lands an hour off is a
-- silently misrouted row.
SET search_path = public, pg_temp
SET timezone = 'UTC'
AS $fn$
DECLARE
  v_start timestamptz;
  v_end   timestamptz;
BEGIN
  IF p_name IS NULL OR p_name !~ '^t_measurement_[0-9]{4}_q[1-4]$' THEN
    RAISE EXCEPTION
      'refusing to create partition %: name must match t_measurement_<year>_q<1-4>',
      p_name
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_start IS NULL OR p_end IS NULL THEN
    RAISE EXCEPTION 'refusing to create partition %: boundaries must not be null', p_name
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Coerced inside the body so the function's own timezone setting applies.
  v_start := p_start::timestamptz;
  v_end := p_end::timestamptz;

  IF v_start <> date_trunc('quarter', v_start) THEN
    RAISE EXCEPTION 'refusing to create partition %: % is not the start of a quarter', p_name, v_start
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_end <> v_start + interval '3 months' THEN
    RAISE EXCEPTION 'refusing to create partition %: [%, %) is not a whole quarter', p_name, v_start, v_end
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = p_name
  ) THEN
    RETURN;
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.t_measurement '
    'FOR VALUES FROM (%L) TO (%L)',
    p_name, v_start, v_end
  );
EXCEPTION
  -- Two concurrent imports covering the same new quarter both get past the
  -- EXISTS check. The loser of the race still ends up with the partition it
  -- asked for, which is all the caller cares about.
  WHEN duplicate_table OR unique_violation THEN
    RETURN;
END
$fn$;

COMMENT ON FUNCTION gc_ensure_measurement_partition(text, date, date) IS
  'Creates a quarterly t_measurement partition on behalf of gc_app. SECURITY DEFINER: runs as gc_owner, which owns the table.';

-- EXECUTE on a function defaults to PUBLIC, which would hand a SECURITY DEFINER
-- entry point to every role in the cluster including gc_readonly.
REVOKE EXECUTE ON FUNCTION gc_ensure_measurement_partition(text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gc_ensure_measurement_partition(text, date, date) TO gc_app;
