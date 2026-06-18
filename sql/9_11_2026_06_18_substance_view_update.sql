\c grottoce;

-- ============================================================
-- Migration: Update v_measurement_wide to include ts.id_substance
--
-- The view was recreated in 9_09 after the substance column rename,
-- but ts.id_substance was not included. This migration adds it so
-- BI tools can perform join-based filtering on the substance FK.
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
