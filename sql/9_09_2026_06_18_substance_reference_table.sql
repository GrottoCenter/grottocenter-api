\c grottoce;

-- ============================================================
-- Migration: Create t_substance reference table
--
-- Normalized substance reference table replacing free-text
-- substance fields with proper FK relationships.
-- Supports PubChem external registry lookups.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Create t_substance table
-- ============================================================
CREATE TABLE IF NOT EXISTS t_substance (
  id serial NOT NULL,
  name varchar(200) NOT NULL,
  formula varchar(100),
  cas_number varchar(20),
  external_id varchar(50),
  external_source varchar(50) DEFAULT NULL,
  id_author integer NOT NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  CONSTRAINT t_substance_pk PRIMARY KEY (id),
  CONSTRAINT t_substance_t_caver_fk FOREIGN KEY (id_author) REFERENCES t_caver(id)
);

-- ============================================================
-- 2. Indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS t_substance_name_lower_idx ON t_substance (LOWER(name));
CREATE INDEX IF NOT EXISTS t_substance_external_id_idx ON t_substance (external_id);

COMMIT;

-- ============================================================
-- 3. Rename substance → substance_label on existing tables
--    v_measurement_wide depends on t_time_series.substance,
--    so we drop and recreate the view around the rename.
-- ============================================================
BEGIN;

DROP VIEW IF EXISTS v_measurement_wide;

ALTER TABLE t_sensor_configuration RENAME COLUMN substance TO substance_label;

ALTER TABLE t_time_series RENAME COLUMN substance TO substance_label;
-- Widen to varchar(200) for time series (design spec: wider than sensor config)
ALTER TABLE t_time_series ALTER COLUMN substance_label TYPE varchar(200);

-- Recreate v_measurement_wide with substance_label
CREATE VIEW v_measurement_wide AS
SELECT
  m.id AS measurement_id,
  m.value,
  m.value_si,
  m.value_si * qk.si_to_display_factor + qk.si_to_display_offset AS value_display,
  m.timestamp,
  ts.id AS time_series_id,
  ts.quantity_kind_code,
  ts.unit_symbol,
  ts.substance_label,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || ts.unit_symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || ts.unit_symbol || ')'
  END AS quantity_unit,
  qk.symbol_si AS unit_si,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || qk.symbol_si || ')'
    ELSE ts.quantity_kind_code || ' (' || qk.symbol_si || ')'
  END AS quantity_unit_si,
  qk.display_symbol AS unit_display,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || qk.display_symbol || ')'
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

-- ============================================================
-- 4. Add id_substance FK column on t_sensor_configuration
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 't_sensor_configuration' AND column_name = 'id_substance'
  ) THEN
    ALTER TABLE t_sensor_configuration ADD COLUMN id_substance integer NULL;
  END IF;
END $$;

ALTER TABLE t_sensor_configuration
  DROP CONSTRAINT IF EXISTS t_sensor_configuration_t_substance_fk;
ALTER TABLE t_sensor_configuration
  ADD CONSTRAINT t_sensor_configuration_t_substance_fk
  FOREIGN KEY (id_substance) REFERENCES t_substance(id);

-- ============================================================
-- 5. Add id_substance FK column on t_time_series
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 't_time_series' AND column_name = 'id_substance'
  ) THEN
    ALTER TABLE t_time_series ADD COLUMN id_substance integer NULL;
  END IF;
END $$;

ALTER TABLE t_time_series
  DROP CONSTRAINT IF EXISTS t_time_series_t_substance_fk;
ALTER TABLE t_time_series
  ADD CONSTRAINT t_time_series_t_substance_fk
  FOREIGN KEY (id_substance) REFERENCES t_substance(id);

COMMIT;
