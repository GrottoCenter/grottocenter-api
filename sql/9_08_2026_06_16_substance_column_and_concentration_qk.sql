\c grottoce;

-- ============================================================
-- Migration: Add substance column + consolidate Concentration QK
--
-- Deployed environments have specific *Concentration codes at IDs 17–21
-- and other QKs at 22–26. This migration:
--   1. Adds the substance column to sensor config and time series
--   2. Replaces specific concentration codes with a single generic
--      Concentration code, reassigning IDs to eliminate gaps
--   3. Updates the IsotopeDelta ID from 26 to 22
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Add substance column to existing tables
-- ============================================================
ALTER TABLE t_sensor_configuration ADD COLUMN IF NOT EXISTS substance varchar(100) NULL;
ALTER TABLE t_time_series ADD COLUMN IF NOT EXISTS substance varchar(100) NULL;

-- ============================================================
-- 2. Replace specific *Concentration codes with generic Concentration
--    First, update any FK references from old codes to the new one.
--    Then delete the old rows and insert the new compact set.
-- ============================================================

-- 2a. Insert generic Concentration at id 17 (reusing NitrateConcentration's slot)
UPDATE t_quantity_kind SET code = 'Concentration',
  url = 'http://qudt.org/vocab/quantitykind/AmountOfSubstanceConcentration'
WHERE id = 17 AND code = 'NitrateConcentration';

-- 2b. Migrate any sensor configs referencing old specific codes (18–21) to the generic (17)
UPDATE t_sensor_configuration SET id_quantity_kind = 17
WHERE id_quantity_kind IN (18, 19, 20, 21);

-- 2b2. Update denormalized quantity_kind_code in t_time_series for the retired codes
-- NOTE: Historical time series will have substance = NULL after this migration;
-- users must re-specify substance on their sensor configs going forward.
UPDATE t_time_series SET quantity_kind_code = 'Concentration'
WHERE quantity_kind_code IN (
  'NitrateConcentration', 'NitriteConcentration',
  'AmmoniumConcentration', 'PhosphateConcentration', 'SilicateConcentration'
);

-- 2c. Delete the old specific concentration codes (18–21)
DELETE FROM t_quantity_kind WHERE id IN (18, 19, 20, 21)
  AND code IN ('NitriteConcentration', 'AmmoniumConcentration', 'PhosphateConcentration', 'SilicateConcentration');

-- 2d. Reassign IDs: shift remaining rows down to fill the gap
--     Current: 22=LightIntensity, 23=AirVelocity, 24=WaterVelocity, 25=RadonConcentration, 26=IsotopeDelta
--     Target:  18=LightIntensity, 19=AirVelocity, 20=WaterVelocity, 21=RadonConcentration, 22=IsotopeDelta

-- Make FK deferrable so we can update references and PKs in any order
ALTER TABLE t_sensor_configuration
  DROP CONSTRAINT t_sensor_configuration_t_quantity_kind_fk,
  ADD CONSTRAINT t_sensor_configuration_t_quantity_kind_fk
    FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id)
    DEFERRABLE INITIALLY IMMEDIATE;

SET CONSTRAINTS t_sensor_configuration_t_quantity_kind_fk DEFERRED;

-- Update FK references first
UPDATE t_sensor_configuration SET id_quantity_kind = 18 WHERE id_quantity_kind = 22;
UPDATE t_sensor_configuration SET id_quantity_kind = 19 WHERE id_quantity_kind = 23;
UPDATE t_sensor_configuration SET id_quantity_kind = 20 WHERE id_quantity_kind = 24;
UPDATE t_sensor_configuration SET id_quantity_kind = 21 WHERE id_quantity_kind = 25;
UPDATE t_sensor_configuration SET id_quantity_kind = 22 WHERE id_quantity_kind = 26;

-- Now shift the quantity kind rows themselves
UPDATE t_quantity_kind SET id = 18 WHERE id = 22 AND code = 'LightIntensity';
UPDATE t_quantity_kind SET id = 19 WHERE id = 23 AND code = 'AirVelocity';
UPDATE t_quantity_kind SET id = 20 WHERE id = 24 AND code = 'WaterVelocity';
UPDATE t_quantity_kind SET id = 21 WHERE id = 25 AND code = 'RadonConcentration';
UPDATE t_quantity_kind SET id = 22 WHERE id = 26 AND code = 'IsotopeDelta';

-- 2e. Reset the sequence
SELECT setval('t_quantity_kind_id_seq', (SELECT MAX(id) FROM t_quantity_kind));

-- 2f. Resolve deferred constraints so the ALTER below can proceed
SET CONSTRAINTS t_sensor_configuration_t_quantity_kind_fk IMMEDIATE;

-- 2g. Restore FK constraint to NOT DEFERRABLE (original DDL definition)
ALTER TABLE t_sensor_configuration
  DROP CONSTRAINT t_sensor_configuration_t_quantity_kind_fk,
  ADD CONSTRAINT t_sensor_configuration_t_quantity_kind_fk
    FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id);

-- ============================================================
-- 3. Update v_measurement_wide to include substance in compound labels
-- ============================================================
DROP VIEW IF EXISTS v_measurement_wide;
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

COMMIT;
