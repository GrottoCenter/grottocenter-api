\c grottoce;

-- Real-time search indexing through an outbox (#1871).
--
-- Every write the search documents depend on enqueues a row here, in the
-- transaction of the write: a change is never indexed before it commits, and
-- never lost when it does. A pg-boss job (SearchOutboxQueueService) drains the
-- table every minute, works out which search documents each row affects and
-- re-indexes them from the database.
--
-- The triggers only record what changed; the worker computes the fan-out
-- (an entrance moving to another cave re-indexes both caves, a renamed massif
-- re-indexes the entrances inside it…). Reference tables (t_country, t_type,
-- t_license, t_subject, t_iso3166_2) have no trigger: they change by hand, and
-- the weekly full sync picks them up.
--
-- `kind` names the change, not always a collection:
--   * entrance, cave, massif, organization, caver, document: a row of the
--     table, which the worker fans out;
--   * entrance_name, cave_name, massif_name, organization_name: a t_name row of
--     that entity, keyed by the entity id;
--   * entrances, documents, organizations, devices: re-index that one document.
-- `old_values` holds, for an UPDATE, the previous value of each fan-out column
-- that changed (an empty object when none did), for a DELETE all of them, and
-- is NULL for an INSERT.
--
-- The test DB loads this file up to the `\c postgres;` line (test/customSQL.js),
-- so keep the cron section last.

CREATE TABLE IF NOT EXISTS t_search_outbox (
  id bigserial PRIMARY KEY,
  kind varchar(32) NOT NULL,
  id_entity integer NOT NULL,
  operation char(1) NOT NULL,
  old_values jsonb,
  date_inscription timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE t_search_outbox OWNER TO gc_owner;

-- Row trigger: TG_ARGV[0] is the kind, the other arguments the fan-out columns
-- whose previous value the worker needs. Rows are read as jsonb so one function
-- serves every table. A geometry reads as GeoJSON, a geography as hex EWKB.
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
  RETURN NULL;
END;
$$;
ALTER FUNCTION search_outbox_enqueue() OWNER TO gc_owner;

-- Row trigger for the rows that belong to another entity: the arguments are
-- (kind, column) pairs, and each pair enqueues the entity the row pointed at
-- before and after the change.
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
    i := i + 2;
  END LOOP;
  RETURN NULL;
END;
$$;
ALTER FUNCTION search_outbox_enqueue_refs() OWNER TO gc_owner;

-- Entities. An UPDATE that changes nothing enqueues nothing.
CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_entrance FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('entrance', 'id_cave', 'point_geom', 'is_deleted', 'redirect_to');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_entrance FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('entrance', 'id_cave', 'point_geom', 'is_deleted', 'redirect_to');

CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_cave FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('cave', 'is_deleted', 'redirect_to');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_cave FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('cave', 'is_deleted', 'redirect_to');

CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_massif FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('massif', 'geog_polygon', 'is_deleted', 'redirect_to');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_massif FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('massif', 'geog_polygon', 'is_deleted', 'redirect_to');

-- A DELETE on t_grotto is turned into a soft delete, which fires the UPDATE one
CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_grotto FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('organization', 'is_deleted', 'redirect_to');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_grotto FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('organization', 'is_deleted', 'redirect_to');

-- Only the columns search reads: a caver row also changes on every login
CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_caver FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('caver', 'nickname');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_caver FOR EACH ROW
  WHEN ((OLD.mail, OLD.date_inscription, OLD.name, OLD.surname, OLD.nickname)
    IS DISTINCT FROM (NEW.mail, NEW.date_inscription, NEW.name, NEW.surname, NEW.nickname))
  EXECUTE FUNCTION search_outbox_enqueue('caver', 'nickname');

-- json has no equality operator, so compare the rows as jsonb
CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_document FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('document');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_document FOR EACH ROW
  WHEN ((to_jsonb(OLD) - 'modified_doc_json') IS DISTINCT FROM (to_jsonb(NEW) - 'modified_doc_json'))
  EXECUTE FUNCTION search_outbox_enqueue('document');

CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_device FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('devices');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_device FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('devices');

-- Rows that belong to an entity
CREATE OR REPLACE TRIGGER search_outbox_refs
  AFTER INSERT OR UPDATE OR DELETE ON t_name FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue_refs(
    'entrance_name', 'id_entrance',
    'cave_name', 'id_cave',
    'massif_name', 'id_massif',
    'organization_name', 'id_grotto'
  );

CREATE OR REPLACE TRIGGER search_outbox_refs
  AFTER INSERT OR UPDATE OR DELETE ON t_comment FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue_refs('entrances', 'id_entrance');

-- A document description is also the title its children show for their parent
CREATE OR REPLACE TRIGGER search_outbox_refs
  AFTER INSERT OR UPDATE OR DELETE ON t_description FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue_refs('document', 'id_document');

CREATE OR REPLACE TRIGGER search_outbox_refs
  AFTER INSERT OR UPDATE OR DELETE ON j_grotto_caver FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue_refs('organizations', 'id_grotto');

DO $$
DECLARE
  link text;
BEGIN
  FOREACH link IN ARRAY ARRAY[
    'j_document_caver_author',
    'j_document_country',
    'j_document_entrance',
    'j_document_grotto_author',
    'j_document_iso3166_2',
    'j_document_language',
    'j_document_massif',
    'j_document_subject'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER search_outbox_refs
         AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW
         EXECUTE FUNCTION search_outbox_enqueue_refs(''documents'', ''id_document'')',
      link
    );
  END LOOP;
END;
$$;

-- The data quality of an entrance is read from v_data_quality_compute_entrance,
-- refreshed once a day, and scores each latest date by its age (under 2, 5, 10
-- years). Run after the refresh, this enqueues the entrances whose score may
-- have changed since the previous run: a date in the last day, or one that
-- turned 2, 5 or 10 years old. The 25-hour window covers a late refresh.
-- A contribution removed without a newer one waits for the weekly full sync.
CREATE OR REPLACE FUNCTION search_outbox_enqueue_data_quality() RETURNS void
LANGUAGE sql AS $$
  INSERT INTO t_search_outbox (kind, id_entity, operation)
  SELECT DISTINCT 'entrances', vq.id_entrance, 'U'
  FROM v_data_quality_compute_entrance vq
  CROSS JOIN LATERAL (VALUES
    (vq.general_latest_date_of_update),
    (vq.location_latest_date_of_update),
    (vq.description_latest_date_of_update),
    (vq.document_latest_date_of_update),
    (vq.rigging_latest_date_of_update),
    (vq.history_latest_date_of_update),
    (vq.comment_latest_date_of_update)
  ) AS d(date_of_update)
  CROSS JOIN (VALUES
    (interval '0'), (interval '2 years'), (interval '5 years'), (interval '10 years')
  ) AS t(age)
  WHERE d.date_of_update + t.age > LOCALTIMESTAMP - interval '25 hours'
  AND d.date_of_update + t.age <= LOCALTIMESTAMP;
$$;
ALTER FUNCTION search_outbox_enqueue_data_quality() OWNER TO gc_owner;

-- Chain the enqueue to the existing refresh job, as sql/1_cron.sql now does.
-- alter_job rather than schedule_in_database: scheduling under the same name
-- only updates the job of the same user, and would add a second job otherwise.
-- Run this part as the owner of the job.
\c postgres;

SELECT cron.alter_job(
    jobid,
    command := $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_data_quality_compute_entrance;
        SELECT search_outbox_enqueue_data_quality();
    $$
)
FROM cron.job
WHERE jobname = 'Refresh data quality view daily';
