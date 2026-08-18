const UPDATE_SEQUENCES_QUERY = `
-- See this page to know how to get all the sequences updated: https://wiki.postgresql.org/wiki/Fixing_Sequences

-- t_ tables
SELECT SETVAL('public.t_cave_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_cave;
SELECT SETVAL('public.t_caver_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_caver;
SELECT SETVAL('public.t_comment_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_comment;
SELECT SETVAL('public.t_description_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_description;
SELECT SETVAL('public.t_document_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_document;
SELECT SETVAL('public.t_entrance_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_entrance;
SELECT SETVAL('public.t_file_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_file;
SELECT SETVAL('public.t_grotto_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_grotto;
SELECT SETVAL('public.t_group_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_group;
SELECT SETVAL('public.t_history_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_history;
SELECT SETVAL('public.t_location_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_location;
SELECT SETVAL('public.t_massif_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_massif;
SELECT SETVAL('public.t_name_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_name;
SELECT SETVAL('public.t_notification_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_notification;
SELECT SETVAL('public.t_option_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_option;
SELECT SETVAL('public.t_point_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_point;
SELECT SETVAL('public.t_region_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_region;
SELECT SETVAL('public.t_rigging_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_rigging;
SELECT SETVAL('public.t_conversation_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_conversation;
SELECT SETVAL('public.t_message_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_message;
SELECT SETVAL('public.t_conversation_archive_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_conversation_archive;
SELECT SETVAL('public.t_device_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_device;
SELECT SETVAL('public.t_sensor_configuration_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_sensor_configuration;
SELECT SETVAL('public.t_quantity_kind_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_quantity_kind;
SELECT SETVAL('public.t_unit_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_unit;
SELECT SETVAL('public.t_substance_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_substance;
SELECT SETVAL('public.t_guideline_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_guideline;
`;

const ALTER_MASSIF_COLUMN_GEOG_POLYGON = `
ALTER TABLE public.t_massif ALTER COLUMN geog_polygon TYPE geography USING geog_polygon::geography;
`;

const ALTER_ENTRANCE_COLUMN_POINT_GEOM =
  'ALTER TABLE t_entrance ADD COLUMN point_geom geometry(Point, 4326);';

const CREATE_ENTRANCE_POINT_GEOM_INSERT_TRIGGER = `
CREATE OR REPLACE FUNCTION set_entrance_point_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.point_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point_geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_entrance_point_geom_trigger
  BEFORE INSERT OR UPDATE ON t_entrance
  FOR EACH ROW
  EXECUTE PROCEDURE set_entrance_point_geom();
`;

const POPULATE_ENTRANCE_POINT_GEOM = `
  UPDATE t_entrance
  SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND point_geom IS NULL;
`;

const INDEX_OPTIMIZATION_MIGRATION = `
-- Drop dead indexes
DROP INDEX IF EXISTS idx_t_cave_is_deleted;
DROP INDEX IF EXISTS idx_t_file_validated;
DROP INDEX IF EXISTS idx_t_name_point;
ALTER TABLE t_caver DROP CONSTRAINT IF EXISTS t_caver_login_key;
DROP INDEX IF EXISTS t_caver_idx;
DROP INDEX IF EXISTS idx_j_caver_massif_subscription_caver;
DROP INDEX IF EXISTS idx_j_caver_country_subscription_caver;

-- Production indexes from sql/0_tables.sql
-- (Waterline migrate:drop does not run 0_tables.sql, so these must be
-- created explicitly for the test DB to match production performance.)
CREATE INDEX IF NOT EXISTS t_caver_activation_code_idx ON t_caver USING btree (activation_code);
CREATE INDEX IF NOT EXISTS t_caver_pending_mail_idx ON t_caver(pending_mail);
CREATE INDEX IF NOT EXISTS idx_j_caver_group_caver ON j_caver_group(id_caver);
CREATE INDEX IF NOT EXISTS idx_j_caver_group_group ON j_caver_group(id_group);
CREATE INDEX IF NOT EXISTS idx_j_grotto_caver_caver ON j_grotto_caver(id_caver);
CREATE INDEX IF NOT EXISTS idx_j_grotto_caver_grotto ON j_grotto_caver(id_grotto);
CREATE INDEX IF NOT EXISTS idx_t_cave_author ON t_cave(id_author);
CREATE INDEX IF NOT EXISTS idx_entrance_geom_gist ON t_entrance USING gist (point_geom);
CREATE INDEX IF NOT EXISTS idx_t_entrance_cave ON t_entrance(id_cave) WHERE id_cave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_entrance_country ON t_entrance(id_country);
CREATE INDEX IF NOT EXISTS idx_t_entrance_is_deleted ON t_entrance(is_deleted);
CREATE INDEX IF NOT EXISTS idx_t_location_entrance ON t_location(id_entrance);
CREATE INDEX IF NOT EXISTS idx_t_rigging_entrance ON t_rigging(id_entrance) WHERE id_entrance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_rigging_cave ON t_rigging(id_cave) WHERE id_cave IS NOT NULL;
CREATE INDEX IF NOT EXISTS j_caver_cave_explorer_id_caver_idx ON j_caver_cave_explorer (id_caver);
CREATE INDEX IF NOT EXISTS j_caver_cave_explorer_id_cave_idx ON j_caver_cave_explorer (id_cave);
CREATE INDEX IF NOT EXISTS j_caver_entrance_explorer_id_caver_idx ON j_caver_entrance_explorer (id_caver);
CREATE INDEX IF NOT EXISTS j_caver_entrance_explorer_id_entrance_idx ON j_caver_entrance_explorer (id_entrance);
CREATE UNIQUE INDEX IF NOT EXISTS j_caver_entrance_explorer_unique ON j_caver_entrance_explorer (id_entrance, id_caver);
CREATE INDEX IF NOT EXISTS idx_document_id_parent ON t_document(id_parent) WHERE id_parent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_hierarchy ON t_document(id, id_parent);
CREATE INDEX IF NOT EXISTS idx_t_document_type ON t_document(id_type);
CREATE INDEX IF NOT EXISTS idx_t_document_author ON t_document(id_author);
CREATE INDEX IF NOT EXISTS idx_t_document_is_deleted ON t_document(is_deleted);
CREATE INDEX IF NOT EXISTS idx_t_file_document ON t_file(id_document);
CREATE INDEX IF NOT EXISTS idx_t_history_cave ON t_history(id_cave) WHERE id_cave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_history_entrance ON t_history(id_entrance) WHERE id_entrance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_name_entity_main ON t_name(id_entrance, id_cave, id_massif, id_grotto, is_main) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_name_grotto ON t_name(id_grotto) WHERE id_grotto IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_name_massif ON t_name(id_massif) WHERE id_massif IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_name_cave ON t_name(id_cave) WHERE id_cave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_name_entrance ON t_name(id_entrance) WHERE id_entrance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_j_document_entrance_entrance ON j_document_entrance(id_entrance);
CREATE INDEX IF NOT EXISTS idx_j_document_entrance_document ON j_document_entrance(id_document);
CREATE INDEX IF NOT EXISTS idx_t_description_document ON t_description(id_document) WHERE id_document IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_description_entrance ON t_description(id_entrance) WHERE id_entrance IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_description_cave ON t_description(id_cave) WHERE id_cave IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_j_organization_country_grotto ON j_organization_country(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_country_country ON j_organization_country(id_country);
CREATE INDEX IF NOT EXISTS idx_j_organization_region_grotto ON j_organization_region(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_region_region ON j_organization_region(id_region);
CREATE INDEX IF NOT EXISTS idx_j_organization_massif_grotto ON j_organization_massif(id_grotto);
CREATE INDEX IF NOT EXISTS idx_j_organization_massif_massif ON j_organization_massif(id_massif);

-- Additional test-specific indexes
CREATE INDEX IF NOT EXISTS idx_t_entrance_geom_public
  ON t_entrance USING gist(point_geom)
  WHERE is_sensitive = false AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_t_entrance_iso3166
  ON t_entrance(iso_3166_2) WHERE iso_3166_2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_last_change_date
  ON t_last_change(date_change DESC);
CREATE INDEX IF NOT EXISTS idx_t_last_change_entity
  ON t_last_change(type_entity, id_entity, type_change, date_change);
CREATE INDEX IF NOT EXISTS idx_t_notification_notified_unread
  ON t_notification(id_notified) WHERE date_read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_t_notification_date
  ON t_notification(date_inscription);
CREATE INDEX IF NOT EXISTS idx_t_massif_geog
  ON t_massif USING gist(geog_polygon) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_document_editor
  ON t_document(id_editor) WHERE id_editor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_description_massif
  ON t_description(id_massif) WHERE id_massif IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_grotto_coords
  ON t_grotto(latitude, longitude) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_j_document_caver_author_caver
  ON j_document_caver_author(id_caver);
CREATE INDEX IF NOT EXISTS idx_j_document_grotto_author_grotto
  ON j_document_grotto_author(id_grotto);
CREATE INDEX IF NOT EXISTS idx_h_description_document
  ON h_description(id_document) WHERE id_document IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_j_participant_caver ON j_participant(id_caver);
CREATE INDEX IF NOT EXISTS idx_t_conversation_archive ON t_conversation_archive(id_conversation, id_caver);
CREATE INDEX IF NOT EXISTS idx_t_message_conversation ON t_message(id_conversation, date_sent DESC);

-- Materialized view indexes (tables in test DB)
CREATE INDEX IF NOT EXISTS idx_v_dq_country
  ON v_data_quality_compute_entrance(id_country);
CREATE INDEX IF NOT EXISTS idx_v_dq_entrance
  ON v_data_quality_compute_entrance(id_entrance);
CREATE INDEX IF NOT EXISTS idx_vdqce_entrance_massif
  ON v_data_quality_compute_entrance(id_entrance, id_massif);
CREATE INDEX IF NOT EXISTS idx_v_country_info_country
  ON v_country_info(id_country);
CREATE INDEX IF NOT EXISTS idx_v_region_info_region
  ON v_region_info(id_region);
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_biblio_id
  ON v_bibliographic_metadata(id_document);
CREATE INDEX IF NOT EXISTS idx_v_biblio_status
  ON v_bibliographic_metadata(metadata_status);
CREATE INDEX IF NOT EXISTS idx_v_biblio_oai_id
  ON v_bibliographic_metadata(oai_identifier);
CREATE INDEX IF NOT EXISTS idx_v_biblio_last_update
  ON v_bibliographic_metadata(last_update);
CREATE INDEX IF NOT EXISTS idx_v_biblio_sets
  ON v_bibliographic_metadata USING gin(list_sets);

-- Substance reference table indexes
CREATE UNIQUE INDEX IF NOT EXISTS t_substance_name_lower_idx ON t_substance (LOWER(name));
CREATE INDEX IF NOT EXISTS t_substance_external_id_idx ON t_substance (external_id);

-- Unit symbol uniqueness (required for symbol-based joins in views)
ALTER TABLE t_unit DROP CONSTRAINT IF EXISTS t_unit_symbol_key;
ALTER TABLE t_unit ADD CONSTRAINT t_unit_symbol_key UNIQUE (symbol);

-- History table indexes
CREATE INDEX IF NOT EXISTS idx_h_document_id_massif ON h_document(id_massif);

-- Job batch indexes
CREATE INDEX IF NOT EXISTS idx_job_batch_initiator ON t_job_batch (id_initiator);
CREATE INDEX IF NOT EXISTS idx_job_batch_status ON t_job_batch (status);

-- Prevent a document from referencing itself as its own parent (mirrors migration
-- 9_20_2026_08_18_document_no_self_parent_constraint.sql).
ALTER TABLE t_document
  DROP CONSTRAINT IF EXISTS t_document_no_self_parent;
ALTER TABLE t_document
  ADD CONSTRAINT t_document_no_self_parent CHECK (id <> id_parent);
`;

// Convert t_measurement from a regular table (created by Waterline migrate:drop)
// to a partitioned table matching production DDL. Required because PostgreSQL
// PARTITION OF only works with a partitioned parent table, and the PartitionManager
// integration tests need to verify real DDL.
const CONVERT_MEASUREMENT_TO_PARTITIONED = `
DO $$
BEGIN
  -- Only convert if the table is NOT already partitioned
  IF NOT EXISTS (
    SELECT 1 FROM pg_partitioned_table
    WHERE partrelid = 'public.t_measurement'::regclass
  ) THEN
    -- Drop the plain table and recreate as partitioned
    DROP TABLE IF EXISTS t_measurement CASCADE;
    CREATE TABLE t_measurement (
      id SERIAL,
      id_time_series INTEGER NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      value_si DOUBLE PRECISION NOT NULL,
      timestamp TIMESTAMPTZ,
      PRIMARY KEY (id, timestamp)
    ) PARTITION BY RANGE (timestamp);

    CREATE INDEX IF NOT EXISTS idx_measurement_time_series
      ON t_measurement (id_time_series, timestamp);
  END IF;
END $$;
`;

const QUERY_PERFORMANCE_FIXES_MIGRATION = `
-- Fix 4: Add synthetic PK to t_last_change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 't_last_change' AND column_name = 'id'
  ) THEN
    ALTER TABLE t_last_change ADD COLUMN id SERIAL PRIMARY KEY;
  END IF;
END $$;

-- Fix 3: Notification covering index
CREATE INDEX IF NOT EXISTS idx_t_notification_notified
  ON t_notification(id_notified, date_inscription DESC);

-- Fix 5: Replace partial comment indexes with non-partial
DROP INDEX IF EXISTS idx_t_comment_entrance;
DROP INDEX IF EXISTS idx_t_comment_cave;
CREATE INDEX IF NOT EXISTS idx_t_comment_entrance ON t_comment(id_entrance);
CREATE INDEX IF NOT EXISTS idx_t_comment_cave ON t_comment(id_cave);
`;

// Create t_bibliographic_metadata table (no Waterline model exists for this
// table, so migrate:drop does not create it). Required for testing permanent
// document deletion which must clean up bibliographic metadata FK references.
const CREATE_BIBLIOGRAPHIC_METADATA_TABLE = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 't_bibliographic_metadata'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'e_metadata_status') THEN
      CREATE TYPE e_metadata_status AS ENUM ('registered', 'deleted');
    END IF;
    CREATE TABLE t_bibliographic_metadata (
      id_document int4 NOT NULL,
      oai_identifier varchar(50) NOT NULL,
      last_update timestamp NOT NULL DEFAULT now(),
      list_sets text[] NULL,
      dc_title text NULL,
      dc_creators text[] NULL,
      dc_contributor text NULL,
      dc_publisher text NULL,
      dc_date date NULL,
      dc_languages bpchar(3)[] NULL,
      dc_descriptions text[] NULL,
      dc_coverages text[] NULL,
      dc_subjects text[] NULL,
      dc_formats text[] NULL,
      dc_identifiers text[] NULL,
      dc_relations text[] NULL,
      dc_sources text[] NULL,
      dc_rights text[] NULL,
      dc_types text[] NULL,
      has_been_updated bool NOT NULL DEFAULT false,
      metadata_status e_metadata_status NOT NULL DEFAULT 'registered',
      children int4[] NULL,
      CONSTRAINT t_record_pk PRIMARY KEY (id_document),
      CONSTRAINT t_record_t_document_fk FOREIGN KEY (id_document) REFERENCES t_document(id)
    );
  END IF;
END $$;
`;

// Drop FK constraints on history tables that reference their parent t_ table.
// These are auto-created by Waterline's migrate:drop but do NOT exist in
// production (where the schema comes from SQL migrations). Dropping them
// aligns the test DB with production behavior and allows permanent deletes
// to preserve history rows for auditability.
const DROP_HISTORY_PARENT_FK_CONSTRAINTS = `
-- Parent FK constraints (h_.id -> t_.id)
ALTER TABLE h_entrance DROP CONSTRAINT IF EXISTS h_entrance_t_entrance;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_description;
ALTER TABLE h_location DROP CONSTRAINT IF EXISTS h_location_t_location;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_rigging;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_history;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_comment;
ALTER TABLE h_cave DROP CONSTRAINT IF EXISTS h_cave_t_cave;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_name;
-- Cross-entity FKs referencing t_entrance(id)
ALTER TABLE h_location DROP CONSTRAINT IF EXISTS h_location_t_entrance_fk;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_entrance_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_entrance1_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_entrance2_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_entrance1_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_entrance2_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_entrance_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_entrance1_fk;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_entrance_fk;
-- Cross-entity FKs referencing t_cave(id)
ALTER TABLE h_entrance DROP CONSTRAINT IF EXISTS h_entrance_t_cave_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_cave_fk;
ALTER TABLE h_comment DROP CONSTRAINT IF EXISTS h_comment_t_cave_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_cave_fk;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_cave_fk;
ALTER TABLE h_document DROP CONSTRAINT IF EXISTS h_document_t_cave_fk;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_cave0_fk;
-- Guideline history parent FK
ALTER TABLE h_guideline DROP CONSTRAINT IF EXISTS h_guideline_t_guideline_fk;
`;

const CREATE_GUIDELINE_TRIGGERS = `
-- Indexes
CREATE INDEX IF NOT EXISTS idx_t_guideline_is_deleted ON t_guideline(is_deleted);
CREATE INDEX IF NOT EXISTS idx_j_guideline_country_guideline ON j_guideline_country(id_guideline);
CREATE INDEX IF NOT EXISTS idx_j_guideline_country_country ON j_guideline_country(id_country);
CREATE INDEX IF NOT EXISTS idx_j_guideline_region_guideline ON j_guideline_region(id_guideline);
CREATE INDEX IF NOT EXISTS idx_j_guideline_region_region ON j_guideline_region(id_region);
CREATE INDEX IF NOT EXISTS idx_j_guideline_massif_guideline ON j_guideline_massif(id_guideline);
CREATE INDEX IF NOT EXISTS idx_j_guideline_massif_massif ON j_guideline_massif(id_massif);

-- Trigger functions & Triggers
CREATE OR REPLACE FUNCTION histo_delete() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if OLD.is_deleted = true then
RETURN OLD;
end if;
EXECUTE format(
    'UPDATE %I.%I SET is_deleted = true WHERE id = $1.id',
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME
) USING OLD;
RETURN null;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION histo_insert_guideline() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if NEW.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;

INSERT INTO h_guideline (
        id,
        title,
        description,
        id_author,
        id_reviewer,
        id_language,
        date_inscription,
        date_reviewed,
        is_deleted
    )
VALUES (
        NEW.id,
        NEW.title,
        NEW.description,
        NEW.id_author,
        NEW.id_reviewer,
        NEW.id_language,
        NEW.date_inscription,
        date_r,
        NEW.is_deleted
    );

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION histo_update_guideline() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if NEW.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
-- Snapshot Creation Truth Table:
-- 1. Regular Update (OLD.is_deleted = false, NEW.is_deleted = false) -> CREATE SNAPSHOT
-- 2. Soft-Delete    (OLD.is_deleted = false, NEW.is_deleted = true)  -> CREATE SNAPSHOT
-- 3. Restore        (OLD.is_deleted = true,  NEW.is_deleted = false) -> SKIP (restore does not alter state worth capturing)
-- 4. No-Op Delete   (OLD.is_deleted = true,  NEW.is_deleted = true)  -> CREATE SNAPSHOT (though typically caught by app logic)
if NEW.is_deleted = OLD.is_deleted OR (OLD.is_deleted = false AND NEW.is_deleted = true) then
IF NOT EXISTS (SELECT 1 FROM h_guideline WHERE id = OLD.id AND date_reviewed = date_r) THEN
INSERT INTO h_guideline (
        id,
        title,
        description,
        id_author,
        id_reviewer,
        id_language,
        date_inscription,
        date_reviewed,
        is_deleted
    )
VALUES (
        OLD.id,
        OLD.title,
        OLD.description,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.id_language,
        OLD.date_inscription,
        date_r,
        OLD.is_deleted
    );
END IF;
end if;
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION change_guideline() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
BEGIN
type_change := '';
if TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'guideline',
        type_change,
        now(),
        NEW.id,
        id_author,
        NEW.title
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS histo_insert_guideline ON t_guideline;
CREATE TRIGGER histo_insert_guideline AFTER INSERT ON t_guideline FOR EACH ROW EXECUTE PROCEDURE histo_insert_guideline();

DROP TRIGGER IF EXISTS histo_update_guideline ON t_guideline;
CREATE TRIGGER histo_update_guideline BEFORE UPDATE ON t_guideline FOR EACH ROW EXECUTE PROCEDURE histo_update_guideline();

DROP TRIGGER IF EXISTS histo_delete_guideline ON t_guideline;
CREATE TRIGGER histo_delete_guideline BEFORE DELETE ON t_guideline FOR EACH ROW EXECUTE PROCEDURE histo_delete();

DROP TRIGGER IF EXISTS last_change_guideline ON t_guideline;
CREATE TRIGGER last_change_guideline BEFORE INSERT OR UPDATE ON t_guideline FOR EACH ROW EXECUTE PROCEDURE change_guideline();
`;

const CREATE_COMMENT_TRIGGERS = `
CREATE OR REPLACE FUNCTION change_comment() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'comment',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS last_change_comment ON t_comment;
CREATE TRIGGER last_change_comment BEFORE INSERT OR UPDATE ON t_comment FOR EACH ROW EXECUTE PROCEDURE change_comment();
`;

const CREATE_SUB_ENTITY_TRIGGERS = `
CREATE OR REPLACE FUNCTION change_history() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'history',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS last_change_history ON t_history;
CREATE TRIGGER last_change_history BEFORE INSERT OR UPDATE ON t_history FOR EACH ROW EXECUTE PROCEDURE change_history();

CREATE OR REPLACE FUNCTION change_location() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'location',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS last_change_location ON t_location;
CREATE TRIGGER last_change_location BEFORE INSERT OR UPDATE ON t_location FOR EACH ROW EXECUTE PROCEDURE change_location();

CREATE OR REPLACE FUNCTION change_description() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE type_related_entity varchar(20);
DECLARE id_related_entity int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' AND NEW.id_document is null then
if NEW.id_cave is not null then
type_related_entity := 'cave';
id_related_entity := NEW.id_cave;
elsif NEW.id_entrance is not null then
type_related_entity := 'entrance';
id_related_entity := NEW.id_entrance;
elsif NEW.id_massif is not null then
type_related_entity := 'massif';
id_related_entity := NEW.id_massif;
end if;
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND (tname.id_cave = NEW.id_cave OR tname.id_entrance = NEW.id_entrance OR tname.id_massif = NEW.id_massif) LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'description',
        type_change,
        now(),
        NEW.id,
        id_author,
        type_related_entity,
        id_related_entity,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS last_change_description ON t_description;
CREATE TRIGGER last_change_description BEFORE INSERT OR UPDATE ON t_description FOR EACH ROW EXECUTE PROCEDURE change_description();

CREATE OR REPLACE FUNCTION change_rigging() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'rigging',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS last_change_rigging ON t_rigging;
CREATE TRIGGER last_change_rigging BEFORE INSERT OR UPDATE ON t_rigging FOR EACH ROW EXECUTE PROCEDURE change_rigging();
`;

const ADMIN_MFA_MIGRATION = `
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS totp_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS login_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_used_totp VARCHAR(6) DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_used_totp_at TIMESTAMP DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP DEFAULT NULL;
ALTER TABLE t_caver ADD COLUMN IF NOT EXISTS last_suspicious_email_at TIMESTAMP DEFAULT NULL;
`;

module.exports = {
  UPDATE_SEQUENCES_QUERY,
  ALTER_MASSIF_COLUMN_GEOG_POLYGON,
  ALTER_ENTRANCE_COLUMN_POINT_GEOM,
  CREATE_ENTRANCE_POINT_GEOM_INSERT_TRIGGER,
  POPULATE_ENTRANCE_POINT_GEOM,
  INDEX_OPTIMIZATION_MIGRATION,
  QUERY_PERFORMANCE_FIXES_MIGRATION,
  CREATE_BIBLIOGRAPHIC_METADATA_TABLE,
  DROP_HISTORY_PARENT_FK_CONSTRAINTS,
  ADMIN_MFA_MIGRATION,
  CONVERT_MEASUREMENT_TO_PARTITIONED,
  CREATE_GUIDELINE_TRIGGERS,
  CREATE_COMMENT_TRIGGERS,
  CREATE_SUB_ENTITY_TRIGGERS,
};
