\c grottoce;

-- =============================================================================
-- #1886: t_bot_outbox, the changes the withdrawal worker acts on
-- =============================================================================
--
-- A page that must go (an entrance turned sensitive, a record deleted or
-- merged) cannot wait for the nightly run. The worker
-- (api/services/BotOutboxQueueService.js) reads this table every minute, works
-- out which PAGES the rows affect, and removes or re-renders them.
--
-- Same shape as t_search_outbox (sql/9_22_2026_10_12_search_outbox.sql) and
-- filled by the SAME trigger functions, in the transaction of the write. It is a
-- table of its own, not a shared one: the search drain deletes the rows it has
-- processed, and a cursor per consumer on a bigserial is unsafe (transactions
-- commit out of order), so sharing would tie the production search sync to this
-- worker. The worker deletes the exact ids it handled, like the search drain.
--
-- Which writes: only the kinds a page is built from. The two trigger functions
-- below are the ones of the search outbox with one more INSERT; the search
-- insert is unchanged and unconditional, so t_search_outbox receives exactly
-- the rows it did before.
--   * entrance, cave, massif, organization: a row of the table, from
--     search_outbox_enqueue (the same old_values);
--   * entrance_name, cave_name, massif_name, organization_name: a t_name row of
--     that entity, from search_outbox_enqueue_refs;
--   * entrance_description, cave_description, massif_description: a t_description
--     row of that entity, from bot_outbox_enqueue_refs on t_description. The
--     view hides a description whose text no longer matches its scan, so an
--     edit takes the old text off the page at once, and the new one returns
--     with the next scan.
-- Documents, cavers, devices, comments and the data quality job are not on a
-- page and enqueue nothing here. The cost is one more small INSERT per write
-- to the four tables, to t_name and to t_description.
--
-- Retention: bot_outbox_trim() deletes the rows older than 14 days. The worker
-- calls it on each run, and a pg_cron job calls it daily, so a worker that is
-- off or failing cannot make the table grow without bound. What a trimmed row
-- would have done is done by the nightly run, which compares every page with
-- v_bot_page: the only cost is that the page is withdrawn at night instead of
-- within minutes.
--
-- The daily job is also listed in sql/1_cron.sql, where the other pg_cron jobs
-- are. bot_outbox_trim() is not SECURITY DEFINER: it runs with the privileges of
-- the user the job runs as, which therefore needs DELETE on t_bot_outbox. That
-- is the user that schedules it (the owner of the other jobs, which inherits
-- gc_owner, the owner of the table); check with
-- `SELECT username FROM cron.job WHERE jobname = 'Trim bot outbox daily'`.
--
-- Production does not run migrations on deploy: apply this file by hand (the
-- last part as the owner of the pg_cron jobs). Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_bot_outbox (
  id bigserial PRIMARY KEY,
  kind varchar(32) NOT NULL,
  id_entity integer NOT NULL,
  operation char(1) NOT NULL,
  old_values jsonb,
  date_inscription timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE t_bot_outbox OWNER TO gc_owner;

-- The trim reads by age
CREATE INDEX IF NOT EXISTS t_bot_outbox_date_idx ON t_bot_outbox (date_inscription);

-- Rows older than the retention, deleted; returns how many
CREATE OR REPLACE FUNCTION bot_outbox_trim() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  trimmed integer;
BEGIN
  DELETE FROM t_bot_outbox WHERE date_inscription < now() - interval '14 days';
  GET DIAGNOSTICS trimmed = ROW_COUNT;
  RETURN trimmed;
END;
$$;
ALTER FUNCTION bot_outbox_trim() OWNER TO gc_owner;

-- search_outbox_enqueue of sql/9_22_2026_10_12_search_outbox.sql, with the bot
-- insert for the four tables a page is built from.
CREATE OR REPLACE FUNCTION search_outbox_enqueue() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  new_row jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  previous jsonb;
  col text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    previous := '{}'::jsonb;
    FOREACH col IN ARRAY COALESCE(TG_ARGV[1:], '{}') LOOP
      IF TG_OP = 'DELETE' OR old_row -> col IS DISTINCT FROM new_row -> col THEN
        previous := previous || jsonb_build_object(col, old_row -> col);
      END IF;
    END LOOP;
  END IF;
  INSERT INTO t_search_outbox (kind, id_entity, operation, old_values)
  VALUES (
    TG_ARGV[0],
    (COALESCE(new_row, old_row) ->> 'id')::integer,
    left(TG_OP, 1),
    previous
  );
  IF TG_ARGV[0] IN ('entrance', 'cave', 'massif', 'organization') THEN
    INSERT INTO t_bot_outbox (kind, id_entity, operation, old_values)
    VALUES (
      TG_ARGV[0],
      (COALESCE(new_row, old_row) ->> 'id')::integer,
      left(TG_OP, 1),
      previous
    );
  END IF;
  RETURN NULL;
END;
$$;
ALTER FUNCTION search_outbox_enqueue() OWNER TO gc_owner;

-- search_outbox_enqueue_refs of the same file, with the bot insert for the name
-- kinds.
CREATE OR REPLACE FUNCTION search_outbox_enqueue_refs() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  new_row jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  i integer := 0;
BEGIN
  WHILE i < TG_NARGS LOOP
    INSERT INTO t_search_outbox (kind, id_entity, operation)
    SELECT DISTINCT TG_ARGV[i], ref::integer, left(TG_OP, 1)
    FROM (VALUES (old_row ->> TG_ARGV[i + 1]), (new_row ->> TG_ARGV[i + 1])) AS v(ref)
    WHERE ref IS NOT NULL;
    IF TG_ARGV[i] IN ('entrance_name', 'cave_name', 'massif_name', 'organization_name') THEN
      INSERT INTO t_bot_outbox (kind, id_entity, operation)
      SELECT DISTINCT TG_ARGV[i], ref::integer, left(TG_OP, 1)
      FROM (VALUES (old_row ->> TG_ARGV[i + 1]), (new_row ->> TG_ARGV[i + 1])) AS v(ref)
      WHERE ref IS NOT NULL;
    END IF;
    i := i + 2;
  END LOOP;
  RETURN NULL;
END;
$$;
ALTER FUNCTION search_outbox_enqueue_refs() OWNER TO gc_owner;

-- The same for rows that only the bot outbox cares about: the arguments are
-- (kind, column) pairs, and each pair enqueues the entity the row pointed at
-- before and after the change.
CREATE OR REPLACE FUNCTION bot_outbox_enqueue_refs() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  new_row jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  i integer := 0;
BEGIN
  WHILE i < TG_NARGS LOOP
    INSERT INTO t_bot_outbox (kind, id_entity, operation)
    SELECT DISTINCT TG_ARGV[i], ref::integer, left(TG_OP, 1)
    FROM (VALUES (old_row ->> TG_ARGV[i + 1]), (new_row ->> TG_ARGV[i + 1])) AS v(ref)
    WHERE ref IS NOT NULL;
    i := i + 2;
  END LOOP;
  RETURN NULL;
END;
$$;
ALTER FUNCTION bot_outbox_enqueue_refs() OWNER TO gc_owner;

-- An UPDATE that changes nothing enqueues nothing
CREATE OR REPLACE TRIGGER bot_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_description FOR EACH ROW
  EXECUTE FUNCTION bot_outbox_enqueue_refs(
    'entrance_description', 'id_entrance',
    'cave_description', 'id_cave',
    'massif_description', 'id_massif'
  );
CREATE OR REPLACE TRIGGER bot_outbox_update
  AFTER UPDATE ON t_description FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION bot_outbox_enqueue_refs(
    'entrance_description', 'id_entrance',
    'cave_description', 'id_cave',
    'massif_description', 'id_massif'
  );

-- Daily trim, for a worker that is off. Run this part as the owner of the jobs;
-- scheduling under the same name updates the job of the same user.
\c postgres;

SELECT cron.schedule_in_database(
    'Trim bot outbox daily',
    '30 4 * * *', -- every day at 4h30
    $$ SELECT bot_outbox_trim(); $$, -- sql/9_37_2026_11_06_bot_outbox.sql
    'grottoce'
);
