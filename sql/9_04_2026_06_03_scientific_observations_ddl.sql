\c grottoce;

-- ============================================================
-- Scientific Observations Schema (DDL)
-- Consolidated from migrations 9_04 through 9_08
-- ============================================================

BEGIN;

-- ============================================================
-- Lookup tables
-- ============================================================

-- Lookup: observation types
CREATE TABLE IF NOT EXISTS t_observation_type (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  url varchar(500) NOT NULL,
  CONSTRAINT t_observation_type_pk PRIMARY KEY (id),
  CONSTRAINT t_observation_type_code_key UNIQUE (code)
);

-- Lookup: quantity kinds (QUDT aligned)
CREATE TABLE IF NOT EXISTS t_quantity_kind (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  url varchar(500) NOT NULL,
  symbol_si varchar(20) NOT NULL,
  display_symbol varchar(20) NOT NULL DEFAULT '',
  si_to_display_factor numeric NOT NULL DEFAULT 1,
  si_to_display_offset numeric NOT NULL DEFAULT 0,
  CONSTRAINT t_quantity_kind_pk PRIMARY KEY (id),
  CONSTRAINT t_quantity_kind_code_key UNIQUE (code)
);

-- Lookup: units of measurement
CREATE TABLE IF NOT EXISTS t_unit (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  symbol varchar(20) NOT NULL,
  CONSTRAINT t_unit_pk PRIMARY KEY (id),
  CONSTRAINT t_unit_code_key UNIQUE (code)
);

-- Lookup: environmental media
CREATE TABLE IF NOT EXISTS t_medium (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  url varchar(500) NOT NULL,
  CONSTRAINT t_medium_pk PRIMARY KEY (id),
  CONSTRAINT t_medium_code_key UNIQUE (code)
);

-- Lookup: human activity types
CREATE TABLE IF NOT EXISTS t_human_activity_type (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  url varchar(500) NOT NULL,
  CONSTRAINT t_human_activity_type_pk PRIMARY KEY (id),
  CONSTRAINT t_human_activity_type_code_key UNIQUE (code)
);

-- Lookup: contaminant types
CREATE TABLE IF NOT EXISTS t_contaminant_type (
  id smallserial NOT NULL,
  code varchar(100) NOT NULL,
  url varchar(500) NOT NULL,
  CONSTRAINT t_contaminant_type_pk PRIMARY KEY (id),
  CONSTRAINT t_contaminant_type_code_key UNIQUE (code)
);

-- ============================================================
-- Repurpose t_point for scientific observation points
-- The old t_point (geology survey) is empty in all environments.
-- ============================================================

-- Step 1: Drop FK constraints referencing t_point
ALTER TABLE t_rigging DROP CONSTRAINT IF EXISTS t_rigging_t_point_fk;
ALTER TABLE h_rigging DROP CONSTRAINT IF EXISTS h_rigging_t_point_fk;
ALTER TABLE t_history DROP CONSTRAINT IF EXISTS t_history_t_point_fk;
ALTER TABLE h_history DROP CONSTRAINT IF EXISTS h_history_t_point_fk;
ALTER TABLE t_junction DROP CONSTRAINT IF EXISTS t_junction_t_point_fk;
ALTER TABLE t_name DROP CONSTRAINT IF EXISTS t_name_t_point_fk;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_point_fk;
ALTER TABLE t_description DROP CONSTRAINT IF EXISTS t_description_t_point_fk;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_point_fk;

-- Step 2: Verify t_point is empty before dropping (safety guard)
DO $$ BEGIN
  ASSERT (SELECT COUNT(*) FROM t_point) = 0,
    't_point must be empty — abort migration';
END $$;

-- Step 3: Drop the old t_point table
DROP TABLE IF EXISTS t_point;

-- Step 4: Recreate t_point with the new schema
CREATE TABLE t_point (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  label varchar(200) NOT NULL,
  latitude numeric(24, 20),
  longitude numeric(24, 20),
  point_geom geometry(Point, 4326),
  id_cave int4 NULL,
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_point_pk PRIMARY KEY (id),
  CONSTRAINT t_point_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_point_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
  CONSTRAINT t_point_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id)
);

CREATE INDEX IF NOT EXISTS idx_point_geom ON t_point USING gist (point_geom);

-- Step 5: Re-add FK constraints pointing to the new t_point
ALTER TABLE t_rigging ADD CONSTRAINT t_rigging_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE h_rigging ADD CONSTRAINT h_rigging_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE t_history ADD CONSTRAINT t_history_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE h_history ADD CONSTRAINT h_history_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE t_junction ADD CONSTRAINT t_junction_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE t_name ADD CONSTRAINT t_name_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE h_name ADD CONSTRAINT h_name_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);

-- Add observation FK column to t_name (for naming observations)
ALTER TABLE t_name ADD COLUMN IF NOT EXISTS id_observation int4 NULL;

-- Add observation FK column to t_description (for describing observations)
ALTER TABLE t_description ADD COLUMN IF NOT EXISTS id_observation int4 NULL;

ALTER TABLE t_description ADD CONSTRAINT t_description_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);
ALTER TABLE h_description ADD CONSTRAINT h_description_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id);

-- ============================================================
-- Observation event
-- ============================================================
CREATE TABLE IF NOT EXISTS t_observation (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  observation_date timestamptz NOT NULL,
  id_point int4 NULL,
  id_cave int4 NULL,
  id_observation_type int4 NOT NULL,
  -- Denormalized fields (BI)
  observation_type_code varchar(100) NOT NULL,
  cave_name varchar,
  point_label varchar(200),
  latitude numeric(24, 20),
  longitude numeric(24, 20),
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_observation_pk PRIMARY KEY (id),
  CONSTRAINT t_observation_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_observation_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
  CONSTRAINT t_observation_t_point_fk FOREIGN KEY (id_point) REFERENCES t_point(id),
  CONSTRAINT t_observation_t_cave_fk FOREIGN KEY (id_cave) REFERENCES t_cave(id),
  CONSTRAINT t_observation_t_observation_type_fk FOREIGN KEY (id_observation_type) REFERENCES t_observation_type(id),
  CONSTRAINT t_observation_point_or_cave CHECK (id_point IS NOT NULL OR id_cave IS NOT NULL)
);

-- ============================================================
-- Device (physical measurement instrument, formerly t_sensor)
-- ============================================================
CREATE TABLE IF NOT EXISTS t_device (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  name varchar(300) NOT NULL,
  brand_name varchar(200),
  product_url varchar(500),
  manufacturer_url varchar(500),
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_device_pk PRIMARY KEY (id),
  CONSTRAINT t_device_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_device_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);

-- Sensor configuration (per-deployment settings: unit, precision, detection limits)
CREATE TABLE IF NOT EXISTS t_sensor_configuration (
  id serial NOT NULL,
  id_author int4 NOT NULL DEFAULT 1,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  id_device int4 NOT NULL,
  id_unit int4 NOT NULL,
  id_quantity_kind int4 NOT NULL,
  precision_upper numeric,
  precision_lower numeric,
  resolution numeric,
  detection_limit_min numeric,
  detection_limit_max numeric,
  substance varchar(100) NULL,
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_sensor_configuration_pk PRIMARY KEY (id),
  CONSTRAINT t_sensor_configuration_t_device_fk FOREIGN KEY (id_device) REFERENCES t_device(id),
  CONSTRAINT t_sensor_configuration_t_unit_fk FOREIGN KEY (id_unit) REFERENCES t_unit(id),
  CONSTRAINT t_sensor_configuration_t_quantity_kind_fk FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id),
  CONSTRAINT t_sensor_configuration_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_sensor_configuration_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id)
);

-- ============================================================
-- Time series (groups measurements from one sensor configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS t_time_series (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  id_observation int4 NOT NULL,
  id_sensor_configuration int4 NOT NULL,
  id_medium int4 NULL,
  sampling_interval_seconds int4 NULL,
  start_date timestamptz NULL,
  end_date timestamptz NULL,
  measurement_count int4 NULL,
  min_value numeric NULL,
  max_value numeric NULL,
  data_quality varchar(20) NOT NULL DEFAULT 'raw',
  -- Denormalized fields (BI)
  quantity_kind_code varchar(100) NOT NULL,
  unit_symbol varchar(20) NOT NULL,
  medium_code varchar(100),
  substance varchar(100) NULL,
  timezone_offset varchar(50),
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_time_series_pk PRIMARY KEY (id),
  CONSTRAINT t_time_series_data_quality_check CHECK (data_quality IN ('raw', 'validated', 'suspect', 'rejected')),
  CONSTRAINT t_time_series_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_time_series_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
  CONSTRAINT t_time_series_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id),
  CONSTRAINT t_time_series_t_sensor_configuration_fk FOREIGN KEY (id_sensor_configuration) REFERENCES t_sensor_configuration(id),
  CONSTRAINT t_time_series_t_medium_fk FOREIGN KEY (id_medium) REFERENCES t_medium(id)
);

-- Index for Superset time-range filtering
CREATE INDEX IF NOT EXISTS idx_time_series_date_range ON t_time_series (start_date, end_date);

-- ============================================================
-- Measurement (individual data points — partitioned by timestamp)
-- ============================================================
CREATE TABLE IF NOT EXISTS t_measurement (
  id bigserial NOT NULL,
  id_time_series int4 NOT NULL,
  value numeric NOT NULL,
  value_si numeric NOT NULL,
  timestamp timestamptz NOT NULL,
  CONSTRAINT t_measurement_pk PRIMARY KEY (id, timestamp),
  CONSTRAINT t_measurement_t_time_series_fk FOREIGN KEY (id_time_series) REFERENCES t_time_series(id)
) PARTITION BY RANGE (timestamp);

-- Quarterly partitions
CREATE TABLE IF NOT EXISTS t_measurement_2020_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2020-07-01') TO ('2020-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2020_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2020-10-01') TO ('2021-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2021_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2021-01-01') TO ('2021-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2021_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2021-04-01') TO ('2021-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2021_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2021-07-01') TO ('2021-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2021_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2021-10-01') TO ('2022-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2022_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2022-01-01') TO ('2022-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2022_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2022-04-01') TO ('2022-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2022_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2022-07-01') TO ('2022-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2022_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2022-10-01') TO ('2023-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2023_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2023_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2023_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2023_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2024_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2024_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2024_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2024_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2025_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2025_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2025_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2025_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_2026_q1 PARTITION OF t_measurement
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS t_measurement_2026_q2 PARTITION OF t_measurement
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS t_measurement_2026_q3 PARTITION OF t_measurement
  FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS t_measurement_2026_q4 PARTITION OF t_measurement
  FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS t_measurement_default PARTITION OF t_measurement DEFAULT;

CREATE INDEX IF NOT EXISTS idx_measurement_time_series ON t_measurement (id_time_series, timestamp);

-- ============================================================
-- Human activity records
-- ============================================================
CREATE TABLE IF NOT EXISTS t_human_activity (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  id_observation int4 NOT NULL,
  id_human_activity_type int4 NOT NULL,
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_human_activity_pk PRIMARY KEY (id),
  CONSTRAINT t_human_activity_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_human_activity_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
  CONSTRAINT t_human_activity_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id),
  CONSTRAINT t_human_activity_t_type_fk FOREIGN KEY (id_human_activity_type) REFERENCES t_human_activity_type(id)
);

-- ============================================================
-- Contamination records
-- ============================================================
CREATE TABLE IF NOT EXISTS t_contamination (
  id serial NOT NULL,
  id_author int4 NOT NULL,
  id_reviewer int4 NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL,
  id_observation int4 NOT NULL,
  id_contaminant_type int4 NOT NULL,
  id_medium int4 NOT NULL,
  -- Denormalized field (BI)
  medium_code varchar(100) NOT NULL,
  is_deleted bool NOT NULL DEFAULT false,
  CONSTRAINT t_contamination_pk PRIMARY KEY (id),
  CONSTRAINT t_contamination_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id),
  CONSTRAINT t_contamination_t_caver2_fk FOREIGN KEY (id_reviewer) REFERENCES t_caver(id),
  CONSTRAINT t_contamination_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id),
  CONSTRAINT t_contamination_t_contaminant_type_fk FOREIGN KEY (id_contaminant_type) REFERENCES t_contaminant_type(id),
  CONSTRAINT t_contamination_t_medium_fk FOREIGN KEY (id_medium) REFERENCES t_medium(id)
);

-- ============================================================
-- Quality audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS t_time_series_quality_log (
  id serial NOT NULL,
  id_time_series int4 NOT NULL,
  old_quality varchar(20),
  new_quality varchar(20) NOT NULL,
  changed_by int4 NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t_time_series_quality_log_pk PRIMARY KEY (id),
  CONSTRAINT t_tsql_t_time_series_fk FOREIGN KEY (id_time_series) REFERENCES t_time_series(id),
  CONSTRAINT t_tsql_t_caver_fk FOREIGN KEY (changed_by) REFERENCES t_caver(id)
);

CREATE INDEX IF NOT EXISTS idx_tsql_time_series ON t_time_series_quality_log (id_time_series);

-- ============================================================
-- Analytics view for Superset
-- ============================================================
CREATE OR REPLACE VIEW v_measurement_wide AS
SELECT
  m.id AS measurement_id,
  m.value,
  m.value_si,
  m.value_si * qk.si_to_display_factor + qk.si_to_display_offset AS value_display,
  m.timestamp,
  ts.id AS time_series_id,
  ts.quantity_kind_code,
  ts.unit_symbol,
  ts.substance,
  CASE WHEN ts.substance IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance || '] (' || ts.unit_symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || ts.unit_symbol || ')'
  END AS quantity_unit,
  qk.symbol_si AS unit_si,
  CASE WHEN ts.substance IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance || '] (' || qk.symbol_si || ')'
    ELSE ts.quantity_kind_code || ' (' || qk.symbol_si || ')'
  END AS quantity_unit_si,
  qk.display_symbol AS unit_display,
  CASE WHEN ts.substance IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance || '] (' || qk.display_symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || qk.display_symbol || ')'
  END AS quantity_unit_display,
  ts.medium_code,
  ts.data_quality,
  ts.sampling_interval_seconds,
  o.id AS observation_id,
  o.observation_date,
  o.observation_type_code,
  o.cave_name,
  o.point_label,
  o.latitude,
  o.longitude,
  CASE WHEN o.latitude IS NOT NULL AND o.longitude IS NOT NULL
    THEN '{"type":"Point","coordinates":[' || o.longitude || ',' || o.latitude || ']}'
    ELSE NULL
  END AS geom,
  COALESCE(o.id_cave, p.id_cave) AS cave_id,
  ts.id_sensor_configuration
FROM t_measurement m
JOIN t_time_series ts ON ts.id = m.id_time_series
JOIN t_observation o ON o.id = ts.id_observation
LEFT JOIN t_point p ON p.id = o.id_point
LEFT JOIN t_quantity_kind qk ON qk.code = ts.quantity_kind_code
WHERE o.is_deleted = false
  AND ts.is_deleted = false;

-- FK constraints for t_name.id_observation (added after referenced tables exist)
ALTER TABLE t_name DROP CONSTRAINT IF EXISTS t_name_t_observation_fk;
ALTER TABLE t_name ADD CONSTRAINT t_name_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id);

-- Add observation FK column to h_name (history table must mirror t_name)
ALTER TABLE h_name ADD COLUMN IF NOT EXISTS id_observation int4 NULL;
ALTER TABLE h_name DROP CONSTRAINT IF EXISTS h_name_t_observation_fk;
ALTER TABLE h_name ADD CONSTRAINT h_name_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id);

-- FK constraints for t_description.id_observation
ALTER TABLE t_description DROP CONSTRAINT IF EXISTS t_description_t_observation_fk;
ALTER TABLE t_description ADD CONSTRAINT t_description_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id);

-- Add observation FK column to h_description (history table must mirror t_description)
ALTER TABLE h_description ADD COLUMN IF NOT EXISTS id_observation int4 NULL;
ALTER TABLE h_description DROP CONSTRAINT IF EXISTS h_description_t_observation_fk;
ALTER TABLE h_description ADD CONSTRAINT h_description_t_observation_fk FOREIGN KEY (id_observation) REFERENCES t_observation(id);

------------------------------------------------------------
-- Update histo_update_name() to include id_observation
------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_name() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
if NEW.is_deleted = OLD.is_deleted then
INSERT INTO h_name (
        id,
        "name",
        is_main,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        id_language,
        id_entrance,
        id_cave,
        id_massif,
        id_point,
        id_grotto,
        id_observation
    )
VALUES (
        OLD.id,
        OLD."name",
        OLD.is_main,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.id_language,
        OLD.id_entrance,
        OLD.id_cave,
        OLD.id_massif,
        OLD.id_point,
        OLD.id_grotto,
        OLD.id_observation
    );
end if;
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Update histo_update_description() to include id_observation
------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_description() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
if NEW.is_deleted = OLD.is_deleted then
INSERT INTO h_description (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        title,
        body,
        id_cave,
        id_entrance,
        id_exit,
        id_massif,
        id_point,
        id_document,
        id_language,
        id_observation
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.title,
        OLD.body,
        OLD.id_cave,
        OLD.id_entrance,
        OLD.id_exit,
        OLD.id_massif,
        OLD.id_point,
        OLD.id_document,
        OLD.id_language,
        OLD.id_observation
    );
end if;
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Table: t_device — soft-delete trigger
------------------------------------------------------------
-- Enables the shared histo_delete() mechanism for t_device:
-- DELETE on a non-deleted row → soft delete (is_deleted = true)
-- DELETE on an already-deleted row → hard delete (actual removal)
------------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_device
  BEFORE DELETE ON t_device
  FOR EACH ROW EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: t_sensor_configuration — Soft-delete trigger
------------------------------------------------------------
-- Enables the shared histo_delete() mechanism for t_sensor_configuration:
-- DELETE on a non-deleted row → soft delete (is_deleted = true)
-- DELETE on an already-deleted row → hard delete (actual removal)
------------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_sensor_configuration
  BEFORE DELETE ON t_sensor_configuration
  FOR EACH ROW EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Index: t_quantity_kind(code) — used by v_measurement_wide
------------------------------------------------------------
-- The materialized view v_measurement_wide joins on qk.code = ts.quantity_kind_code
-- (string join). An index on code speeds up this join for large result sets.
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quantity_kind_code ON t_quantity_kind (code);

COMMIT;
