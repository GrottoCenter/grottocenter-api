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
-- regex bounds it to t_measurement partitions, the boundary checks stop a caller
-- bug from carving the table into something other than whole quarters, and the
-- name is then checked against the boundaries so that a partition cannot be
-- attached under the label of a different quarter.
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
-- silently misrouted row.  DateStyle is pinned because the partition bound is
-- compared as text below and both sides of that comparison render through
-- timestamptz_out, which honours it: they already agree whatever the caller has
-- set, since both run inside one invocation, so this only turns an invariant
-- that holds by arrangement into one that is declared.  It does not affect how
-- p_start and p_end are parsed — that happens in the calling query, before this
-- SET list applies, and PartitionManager sends unambiguous ISO dates.
SET search_path = public, pg_temp
SET timezone = 'UTC'
SET DateStyle = 'ISO, MDY'
AS $fn$
DECLARE
  v_start          timestamptz;
  v_end            timestamptz;
  v_expected_name  text;
  v_expected_bound text;
  v_existing       record;
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

  -- The name and the boundaries have been shape-checked independently, which
  -- says nothing about whether they agree with each other.  Without this check
  -- ('t_measurement_2030_q1', '2031-01-01', '2031-04-01') passes everything
  -- above and attaches the 2031 range under a 2030 name; the next genuine 2030
  -- import then finds the name taken, returns, and its rows land in
  -- t_measurement_default while the 2031 import can never create its own
  -- partition.
  --
  -- The expected name is derived here to be *compared*, not to be used.  Using
  -- it would silently repair a caller bug and make this function a second home
  -- for a naming convention that PartitionManager.js owns; comparing it keeps
  -- that convention in one place and turns any disagreement into a loud failure.
  v_expected_name := format(
    't_measurement_%s_q%s',
    extract(year from v_start)::int,
    extract(quarter from v_start)::int
  );

  IF p_name <> v_expected_name THEN
    RAISE EXCEPTION
      'refusing to create partition %: [%, %) is the range of %',
      p_name, v_start, v_end, v_expected_name
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Idempotence, but narrowly: "some relation is called this" is a weaker claim
  -- than "the partition we were asked for is already there".  Matching on the
  -- parent and the bounds as well as the name means the early return only fires
  -- when re-running really is a no-op, and that an index, a view or a partition
  -- carrying different bounds is raised rather than reported as success.
  --
  -- Bounds are compared as text because PostgreSQL exposes no structural
  -- accessor for them.  That is exact rather than approximate: pg_get_expr and
  -- format('%L') both render the boundary through the type's own output
  -- function, so the session's DateStyle and TimeZone move both sides together.
  v_expected_bound := format('FOR VALUES FROM (%L) TO (%L)', v_start, v_end);

  SELECT c.relkind,
         c.relispartition,
         i.inhparent,
         pg_get_expr(c.relpartbound, c.oid) AS bound
    INTO v_existing
  FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_inherits i ON i.inhrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relname = p_name;

  IF FOUND THEN
    IF v_existing.relkind IN ('r', 'p')
      AND v_existing.relispartition
      AND v_existing.inhparent = 'public.t_measurement'::regclass
      AND v_existing.bound = v_expected_bound
    THEN
      RETURN;
    END IF;

    RAISE EXCEPTION
      'refusing to create partition %: public.% already exists and is not that partition (relkind %, bounds %)',
      p_name, p_name, v_existing.relkind, coalesce(v_existing.bound, '<not a partition>')
      USING ERRCODE = 'invalid_object_definition';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.t_measurement '
    'FOR VALUES FROM (%L) TO (%L)',
    p_name, v_start, v_end
  );
EXCEPTION
  -- Two concurrent imports covering the same new quarter both get past the
  -- existence check above. The loser of the race still ends up with the
  -- partition it asked for, which is all the caller cares about — and since both
  -- callers passed the same validation, the winner cannot have created something
  -- other than the partition the loser wanted.
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
