\c grottoce;

-- ============================================================
-- Scientific Observations Seed Data (local dev only)
-- Demo devices, points, observations, time series, measurements
-- ============================================================

BEGIN;

-- ============================================================
-- Devices (physical instruments)
-- ============================================================
INSERT INTO t_device (id, name, brand_name, product_url) VALUES
  (1, 'Tinytag TGP-4500', 'Gemini Data Loggers', 'https://www.geminidataloggers.com/data-loggers/tinytag-plus-2/tgp-4500'),
  (2, 'Tinytag TGP-4500', 'Gemini Data Loggers', 'https://www.geminidataloggers.com/data-loggers/tinytag-plus-2/tgp-4500'),
  (3, 'Keller DCX-22', 'Keller AG', 'https://www.keller-druck.com/en/products/level-probes/dcx-22'),
  (4, 'Vaisala GMP252', 'Vaisala', 'https://www.vaisala.com/en/products/instruments-sensors-and-other-measurement-devices/instruments-industrial-measurements/gmp252'),
  (5, 'Paratronic SU-14608 (water level)', 'Paratronic', NULL),
  (6, 'Paratronic SU-14608 (temperature)', 'Paratronic', NULL),
  (7, 'Paratronic SU-11436 (water level)', 'Paratronic', NULL),
  (8, 'Paratronic SU-11436 (temperature)', 'Paratronic', NULL),
  (9, 'HOBO Pendant Event 050004770', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/ua-003-64'),
  (10, 'HOBO Pendant Event 050005719', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/ua-003-64'),
  (11, 'HOBO U23-001 (temperature)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001'),
  (12, 'HOBO U23-001 (humidity)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001'),
  (13, 'HOBO U23-001 (dew point)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001'),
  (14, 'HOBO Water Temp Pro v2 010029976', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u22-001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Sensor configurations (deployment-specific settings)
-- ============================================================
INSERT INTO t_sensor_configuration (id, id_device, id_unit, id_quantity_kind, precision_upper, precision_lower, resolution) VALUES
  (1, 1, 1, 1, 0.5, 0.5, 0.01),       -- Tinytag temperature in °C
  (2, 2, 2, 2, 3.0, 3.0, 0.3),         -- Tinytag humidity in %
  (3, 3, 5, 5, 0.01, 0.01, 0.001),     -- Keller water level in m
  (4, 4, 4, 4, 50, 50, 1),             -- Vaisala CO2 in ppm
  (5, 5, 10, 5, NULL, NULL, 1),         -- SU-14608 water level in mm
  (6, 6, 9, 1, NULL, NULL, 0.01),       -- SU-14608 temperature in K
  (7, 7, 10, 5, NULL, NULL, 1),         -- SU-11436 water level in mm
  (8, 8, 9, 1, NULL, NULL, 0.01),       -- SU-11436 temperature in K
  (9, 9, 11, 9, NULL, NULL, 1),         -- Pluviometer AIR in event counts
  (10, 10, 11, 9, NULL, NULL, 1),       -- Pluviometer SOL in event counts
  (11, 11, 1, 1, 0.21, 0.21, 0.02),    -- HOBO U23 temperature in °C
  (12, 12, 2, 2, 2.5, 2.5, 0.1),       -- HOBO U23 humidity in %
  (13, 13, 1, 10, NULL, NULL, 0.1),     -- HOBO U23 dew point in °C
  (14, 14, 1, 1, 0.2, 0.2, 0.02)       -- HOBO Water Temp Pro ground temp in °C
ON CONFLICT DO NOTHING;

-- ============================================================
-- Observation points (using existing cave id=5 from mock data)
-- ============================================================
INSERT INTO t_point (id, id_author, label, latitude, longitude, point_geom, id_cave) VALUES
  (1, 1, 'Salle principale - Station A', 62.798492610654286, 78.5377653268393, ST_SetSRID(ST_MakePoint(78.5377653268393, 62.798492610654286), 4326), 5),
  (2, 1, 'Rivière souterraine - Amont', 62.799100000000000, 78.538200000000000, ST_SetSRID(ST_MakePoint(78.538200000000000, 62.799100000000000), 4326), 5),
  (3, 1, 'Entrée - Station météo', 62.797800000000000, 78.537000000000000, ST_SetSRID(ST_MakePoint(78.537000000000000, 62.797800000000000), 4326), NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Observations
-- ============================================================
INSERT INTO t_observation (id, id_author, observation_date, id_point, id_cave, id_observation_type, observation_type_code, point_label, latitude, longitude) VALUES
  (1, 1, '2025-06-01 10:00:00+00:00', 1, 5, 2, 'physical_measurements', 'Salle principale - Station A', 62.798492610654286, 78.5377653268393),
  (2, 1, '2025-06-01 10:00:00+00:00', 2, 5, 2, 'physical_measurements', 'Rivière souterraine - Amont', 62.799100000000000, 78.538200000000000),
  (3, 1, '2025-06-15 08:00:00+00:00', 1, 5, 1, 'pollution', 'Salle principale - Station A', 62.798492610654286, 78.5377653268393),
  (4, 1, '2025-07-01 09:00:00+00:00', 3, NULL, 2, 'physical_measurements', 'Entrée - Station météo', 62.797800000000000, 78.537000000000000)
ON CONFLICT DO NOTHING;

-- Backfill cave_name from t_name for observations referencing a cave
UPDATE t_observation o
SET cave_name = n.name
FROM t_name n
WHERE n.id = (
  SELECT n2.id FROM t_name n2
  WHERE n2.id_cave = o.id_cave
    AND n2.is_main = true
    AND n2.is_deleted = false
  LIMIT 1
)
AND o.id_cave IS NOT NULL
AND o.cave_name IS NULL;

-- ============================================================
-- Time series
-- ============================================================
INSERT INTO t_time_series (id, id_author, id_observation, id_sensor_configuration, id_medium, sampling_interval_seconds, start_date, end_date, measurement_count, min_value, max_value, data_quality, quantity_kind_code, unit_symbol, medium_code) VALUES
  (1, 1, 1, 1, 2, 900, '2025-06-01 00:00:00+00:00', '2025-08-31 23:45:00+00:00', 8832, 8.2, 9.8, 'validated', 'Temperature', '°C', 'air'),
  (2, 1, 1, 2, 2, 900, '2025-06-01 00:00:00+00:00', '2025-08-31 23:45:00+00:00', 8832, 92.0, 99.5, 'validated', 'RelativeHumidity', '%', 'air'),
  (3, 1, 2, 3, 1, 600, '2025-06-01 00:00:00+00:00', '2025-08-31 23:50:00+00:00', 13248, 0.15, 2.30, 'raw', 'WaterLevel', 'm', 'water'),
  (4, 1, 4, 1, 2, 900, '2025-06-01 00:00:00+00:00', '2025-08-31 23:45:00+00:00', 8832, -5.0, 32.0, 'raw', 'Temperature', '°C', 'air'),
  (5, 1, 4, 4, 2, 1800, '2025-06-01 00:00:00+00:00', '2025-08-31 23:30:00+00:00', 4416, 400, 2500, 'raw', 'CO2Concentration', 'ppm', 'air')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Generated measurements
-- ============================================================

-- Time series 1: temperature in cave (Jun-Aug 2025, stable ~9°C)
INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
SELECT
  1,
  9.0 + 0.4 * sin(2 * pi() * extract(epoch from ts) / 86400) + (random() - 0.5) * 0.2,
  (9.0 + 0.4 * sin(2 * pi() * extract(epoch from ts) / 86400) + (random() - 0.5) * 0.2) + 273.15,
  ts
FROM generate_series(
  '2025-06-01 00:00:00'::timestamptz,
  '2025-08-31 23:45:00'::timestamptz,
  '15 minutes'::interval
) AS ts;

-- Time series 2: humidity in cave (Jun-Aug 2025, stable ~96%)
INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
SELECT
  2,
  96.0 + 1.5 * sin(2 * pi() * extract(epoch from ts) / 86400) + (random() - 0.5) * 0.5,
  (96.0 + 1.5 * sin(2 * pi() * extract(epoch from ts) / 86400) + (random() - 0.5) * 0.5) / 100,
  ts
FROM generate_series(
  '2025-06-01 00:00:00'::timestamptz,
  '2025-08-31 23:45:00'::timestamptz,
  '15 minutes'::interval
) AS ts;

-- Time series 3: water level (Jun-Aug 2025, weekly cycle with rain events)
INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
SELECT
  3,
  0.5 + 0.8 * sin(2 * pi() * extract(epoch from ts) / (7 * 86400)) + greatest(0, (random() - 0.7) * 3),
  0.5 + 0.8 * sin(2 * pi() * extract(epoch from ts) / (7 * 86400)) + greatest(0, (random() - 0.7) * 3),
  ts
FROM generate_series(
  '2025-06-01 00:00:00'::timestamptz,
  '2025-08-31 23:50:00'::timestamptz,
  '10 minutes'::interval
) AS ts;

-- Time series 4: outdoor temperature (Jun-Aug 2025, daily + seasonal cycle)
INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
SELECT
  4,
  15.0 + 5.0 * sin(2 * pi() * extract(epoch from ts) / (92 * 86400)) + 10.0 * sin(2 * pi() * (extract(epoch from ts) - 6*3600) / 86400) + (random() - 0.5) * 2,
  (15.0 + 5.0 * sin(2 * pi() * extract(epoch from ts) / (92 * 86400)) + 10.0 * sin(2 * pi() * (extract(epoch from ts) - 6*3600) / 86400) + (random() - 0.5) * 2) + 273.15,
  ts
FROM generate_series(
  '2025-06-01 00:00:00'::timestamptz,
  '2025-08-31 23:45:00'::timestamptz,
  '15 minutes'::interval
) AS ts;

-- Time series 5: CO2 concentration (Jun-Aug 2025, night buildup / day ventilation)
INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)
SELECT
  5,
  800 + 600 * sin(2 * pi() * (extract(epoch from ts) + 6*3600) / 86400) + (random() - 0.5) * 100,
  (800 + 600 * sin(2 * pi() * (extract(epoch from ts) + 6*3600) / 86400) + (random() - 0.5) * 100) * 0.000001,
  ts
FROM generate_series(
  '2025-06-01 00:00:00'::timestamptz,
  '2025-08-31 23:30:00'::timestamptz,
  '30 minutes'::interval
) AS ts;

-- ============================================================
-- Contamination record
-- ============================================================
INSERT INTO t_contamination (id, id_author, id_observation, id_contaminant_type, id_medium, medium_code) VALUES
  (1, 1, 3, 5, 1, 'water')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Human activity record
-- ============================================================
INSERT INTO t_human_activity (id, id_author, id_observation, id_human_activity_type) VALUES
  (1, 1, 3, 15)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Update entity sequences
-- ============================================================
SELECT setval('t_device_id_seq', (SELECT MAX(id) FROM t_device));
SELECT setval('t_sensor_configuration_id_seq', (SELECT MAX(id) FROM t_sensor_configuration));
SELECT setval('t_point_id_seq', (SELECT MAX(id) FROM t_point));
SELECT setval('t_observation_id_seq', (SELECT MAX(id) FROM t_observation));
SELECT setval('t_time_series_id_seq', (SELECT MAX(id) FROM t_time_series));
SELECT setval('t_contamination_id_seq', (SELECT MAX(id) FROM t_contamination));
SELECT setval('t_human_activity_id_seq', (SELECT MAX(id) FROM t_human_activity));

COMMIT;
