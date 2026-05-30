\c grottoce;

-- ============================================================
-- Migration: Rename t_sensor → t_device, move id_quantity_kind
-- to t_sensor_configuration
--
-- Rationale: A physical device (e.g., a multi-parameter logger)
-- can measure multiple quantities. The quantity kind belongs to
-- the configuration (which channel), not the device itself.
-- ============================================================

BEGIN;

-- 1. Rename table t_sensor → t_device
ALTER TABLE t_sensor RENAME TO t_device;

-- 2. Rename sequence
ALTER SEQUENCE t_sensor_id_seq RENAME TO t_device_id_seq;

-- 3. Rename constraints on t_device
ALTER TABLE t_device RENAME CONSTRAINT t_sensor_pk TO t_device_pk;
ALTER TABLE t_device RENAME CONSTRAINT t_sensor_t_quantity_kind_fk
  TO t_device_t_quantity_kind_fk;

-- 4. Add id_quantity_kind to t_sensor_configuration
ALTER TABLE t_sensor_configuration
  ADD COLUMN id_quantity_kind int4;

-- 5. Populate id_quantity_kind from the device (existing data migration)
UPDATE t_sensor_configuration sc
SET id_quantity_kind = d.id_quantity_kind
FROM t_device d
WHERE d.id = sc.id_sensor;

-- 6. Make id_quantity_kind NOT NULL now that it's populated
ALTER TABLE t_sensor_configuration
  ALTER COLUMN id_quantity_kind SET NOT NULL;

-- 7. Add FK constraint for id_quantity_kind on t_sensor_configuration
ALTER TABLE t_sensor_configuration
  ADD CONSTRAINT t_sensor_configuration_t_quantity_kind_fk
  FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id);

-- 8. Drop id_quantity_kind from t_device (no longer needed there)
ALTER TABLE t_device DROP CONSTRAINT t_device_t_quantity_kind_fk;
ALTER TABLE t_device DROP COLUMN id_quantity_kind;

-- 9. Rename FK column id_sensor → id_device in t_sensor_configuration
ALTER TABLE t_sensor_configuration
  RENAME COLUMN id_sensor TO id_device;

-- 10. Rename FK constraint on t_sensor_configuration
ALTER TABLE t_sensor_configuration
  RENAME CONSTRAINT t_sensor_configuration_t_sensor_fk
  TO t_sensor_configuration_t_device_fk;

-- 11. Recreate the BI view (references id_sensor_configuration, unchanged)
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
  ts.quantity_kind_code || ' (' || ts.unit_symbol || ')' AS quantity_unit,
  qk.symbol_si AS unit_si,
  ts.quantity_kind_code || ' (' || qk.symbol_si || ')' AS quantity_unit_si,
  qk.display_symbol AS unit_display,
  ts.quantity_kind_code || ' (' || qk.display_symbol || ')' AS quantity_unit_display,
  ts.medium_code,
  ts.data_quality,
  ts.sampling_interval_seconds,
  o.id AS observation_id,
  o.observation_date,
  o.observation_type_code,
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
JOIN t_quantity_kind qk ON qk.code = ts.quantity_kind_code
WHERE o.is_deleted = false
  AND ts.is_deleted = false;

COMMIT;
