\c grottoce;

-- ============================================================
-- Migration: Sync v_measurement_wide with production definition
--
-- The last migration (9_12) is missing three additions that were
-- applied directly in production:
--   - observation_name  (from t_name, main non-deleted name)
--   - sensor_label      (from t_sensor_configuration)
--   - device_id / device_name (from t_device via t_sensor_configuration)
--
-- This migration recreates the view to match the live schema.
-- ============================================================

DROP VIEW IF EXISTS v_measurement_wide;

CREATE VIEW v_measurement_wide AS
SELECT
  m.id AS measurement_id,
  m.value,
  CASE WHEN iu.dimension = du.dimension
    THEN m.value_si
    ELSE NULL
  END AS value_si,
  CASE WHEN iu.dimension = du.dimension
    THEN m.value_si * du.si_to_display_factor + du.si_to_display_offset
    ELSE NULL
  END AS value_display,
  iu.dimension AS import_dimension,
  du.dimension AS display_dimension,
  m.timestamp,
  ts.id AS time_series_id,
  ts.quantity_kind_code,
  ts.unit_symbol,
  ts.id_substance,
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
  du.symbol AS unit_display,
  CASE WHEN ts.substance_label IS NOT NULL
    THEN ts.quantity_kind_code || ' [' || ts.substance_label || '] (' || du.symbol || ')'
    ELSE ts.quantity_kind_code || ' (' || du.symbol || ')'
  END AS quantity_unit_display,
  ts.medium_code,
  ts.data_quality,
  ts.sampling_interval_seconds,
  o.id AS observation_id,
  n.name AS observation_name,
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
  ts.id_sensor_configuration,
  sc.label AS sensor_label,
  d.id AS device_id,
  d.name AS device_name
FROM t_measurement m
JOIN t_time_series ts ON ts.id = m.id_time_series
JOIN t_observation o ON o.id = ts.id_observation
LEFT JOIN t_point p ON p.id = o.id_point
LEFT JOIN t_name n ON n.id_observation = o.id AND n.is_main = true AND n.is_deleted = false
LEFT JOIN t_sensor_configuration sc ON sc.id = ts.id_sensor_configuration
LEFT JOIN t_device d ON d.id = sc.id_device
LEFT JOIN t_quantity_kind qk ON qk.code = ts.quantity_kind_code
LEFT JOIN t_unit du ON du.id = qk.id_display_unit
LEFT JOIN t_unit iu ON iu.symbol = ts.unit_symbol
WHERE o.is_deleted = false
  AND ts.is_deleted = false;
