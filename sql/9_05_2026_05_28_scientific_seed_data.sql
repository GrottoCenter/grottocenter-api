\c grottoce;

-- ============================================================
-- Seed data for scientific observation lookup tables
-- ============================================================

-- Observation types
INSERT INTO t_observation_type (id, code, url) VALUES
  (1, 'pollution', 'https://ontology.uis-speleo.org/ontology/#pollution'),
  (2, 'physical_measurements', 'http://www.w3.org/ns/sosa/Observation'),
  (3, 'biospeleological_observation', 'https://dwc.tdwg.org/list/#dwc_Occurrence'),
  (4, 'human_activities', 'https://ontology.uis-speleo.org/ontology/#humanActivities')
ON CONFLICT (code) DO NOTHING;

-- Quantity kinds (QUDT)
INSERT INTO t_quantity_kind (id, code, url, symbol_si, display_symbol, si_to_display_factor, si_to_display_offset) VALUES
  (1, 'Temperature', 'http://qudt.org/vocab/quantitykind/Temperature', 'K', '°C', 1, -273.15),
  (2, 'RelativeHumidity', 'http://qudt.org/vocab/quantitykind/RelativeHumidity', '%', '%', 100, 0),
  (3, 'AtmosphericPressure', 'http://qudt.org/vocab/quantitykind/AtmosphericPressure', 'Pa', 'hPa', 0.01, 0),
  (4, 'CO2Concentration', 'http://qudt.org/vocab/quantitykind/MoleFraction', 'mol/mol', 'ppm', 1000000, 0),
  (5, 'WaterLevel', 'http://qudt.org/vocab/quantitykind/Length', 'm', 'm', 1, 0),
  (6, 'WaterFlow', 'http://qudt.org/vocab/quantitykind/VolumeFlowRate', 'm³/s', 'm³/s', 1, 0),
  (7, 'Conductivity', 'http://qudt.org/vocab/quantitykind/Conductivity', 'S/m', 'µS/cm', 10000, 0),
  (8, 'pH', 'http://qudt.org/vocab/quantitykind/PH', 'pH', 'pH', 1, 0),
  (9, 'Precipitation', 'http://qudt.org/vocab/quantitykind/LiquidPrecipitation', 'm', 'mm', 1000, 0),
  (10, 'DewPointTemperature', 'http://qudt.org/vocab/quantitykind/DewPointTemperature', 'K', '°C', 1, -273.15)
ON CONFLICT (code) DO NOTHING;

-- Units
INSERT INTO t_unit (id, code, symbol) VALUES
  (1, 'degree_celsius', '°C'),
  (2, 'percent', '%'),
  (3, 'hectopascal', 'hPa'),
  (4, 'parts_per_million', 'ppm'),
  (5, 'meter', 'm'),
  (6, 'liter_per_second', 'L/s'),
  (7, 'microsiemens_per_centimeter', 'µS/cm'),
  (8, 'ph_unit', 'pH'),
  (9, 'kelvin', 'K'),
  (10, 'millimeter', 'mm'),
  (11, 'event_count', 'count')
ON CONFLICT (code) DO NOTHING;

-- Media
INSERT INTO t_medium (id, code, url) VALUES
  (1, 'water', 'http://purl.obolibrary.org/obo/ENVO_00002006'),
  (2, 'air', 'http://purl.obolibrary.org/obo/ENVO_00002005'),
  (3, 'soil', 'http://purl.obolibrary.org/obo/ENVO_00001998'),
  (4, 'sediment', 'http://purl.obolibrary.org/obo/ENVO_00002007')
ON CONFLICT (code) DO NOTHING;

-- Methods
INSERT INTO t_method (id, url) VALUES
  (1, 'https://www.iso.org/standard/75281.html')
ON CONFLICT DO NOTHING;

-- Human activity types
INSERT INTO t_human_activity_type (id, code, url) VALUES
  (1, 'guided_tourist_cave', 'https://ontology.uis-speleo.org/ontology/#guidedTouristCave'),
  (2, 'waste_disposal', 'https://ontology.uis-speleo.org/ontology/#wasteDisposal'),
  (3, 'road_drain', 'https://ontology.uis-speleo.org/ontology/#roadDrain'),
  (4, 'storage', 'https://ontology.uis-speleo.org/ontology/#storage'),
  (5, 'habitation', 'https://ontology.uis-speleo.org/ontology/#habitation'),
  (6, 'livestock_shelter', 'https://ontology.uis-speleo.org/ontology/#livestockShelter'),
  (7, 'food_source', 'https://ontology.uis-speleo.org/ontology/#foodSource'),
  (8, 'water_source', 'https://ontology.uis-speleo.org/ontology/#waterSource'),
  (9, 'guano_mining', 'https://ontology.uis-speleo.org/ontology/#guanoMining'),
  (10, 'mine', 'https://ontology.uis-speleo.org/ontology/#mine'),
  (11, 'human_burial_site', 'https://ontology.uis-speleo.org/ontology/#humanBurialSite'),
  (12, 'sacred_site', 'https://ontology.uis-speleo.org/ontology/#sacredSite'),
  (13, 'temple', 'https://ontology.uis-speleo.org/ontology/#temple'),
  (14, 'place_of_a_legend', 'https://ontology.uis-speleo.org/ontology/#placeOfALegend'),
  (15, 'scientific_activity', 'https://ontology.uis-speleo.org/ontology/#scientificActivity'),
  (16, 'place_of_manufacture', 'https://ontology.uis-speleo.org/ontology/#placeOfManufacture'),
  (17, 'traffic_way', 'https://ontology.uis-speleo.org/ontology/#trafficWay')
ON CONFLICT (code) DO NOTHING;

-- Contaminant types
INSERT INTO t_contaminant_type (id, code, url) VALUES
  (1, 'heavy_metals', 'http://purl.obolibrary.org/obo/CHEBI_22977'),
  (2, 'hydrocarbons', 'http://purl.obolibrary.org/obo/CHEBI_24632'),
  (3, 'pesticides', 'http://purl.obolibrary.org/obo/CHEBI_25944'),
  (4, 'microplastics', 'http://purl.obolibrary.org/obo/ENVO_01001555'),
  (5, 'nitrates', 'http://purl.obolibrary.org/obo/CHEBI_17632'),
  (6, 'phosphates', 'http://purl.obolibrary.org/obo/CHEBI_26020'),
  (7, 'bacteria', 'http://purl.obolibrary.org/obo/NCBITaxon_2')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Demo data: sensors, observation points, observations, time series, measurements
-- ============================================================

-- Sensors (physical devices)
INSERT INTO t_sensor (id, name, brand_name, product_url, id_quantity_kind) VALUES
  (1, 'Tinytag TGP-4500', 'Gemini Data Loggers', 'https://www.geminidataloggers.com/data-loggers/tinytag-plus-2/tgp-4500', 1),
  (2, 'Tinytag TGP-4500', 'Gemini Data Loggers', 'https://www.geminidataloggers.com/data-loggers/tinytag-plus-2/tgp-4500', 2),
  (3, 'Keller DCX-22', 'Keller AG', 'https://www.keller-druck.com/en/products/level-probes/dcx-22', 5),
  (4, 'Vaisala GMP252', 'Vaisala', 'https://www.vaisala.com/en/products/instruments-sensors-and-other-measurement-devices/instruments-industrial-measurements/gmp252', 4),
  -- Graners observatory sensors
  (5, 'Paratronic SU-14608 (water level)', 'Paratronic', NULL, 5),   -- ultrasonic water level
  (6, 'Paratronic SU-14608 (temperature)', 'Paratronic', NULL, 1),   -- ultrasonic temperature channel
  (7, 'Paratronic SU-11436 (water level)', 'Paratronic', NULL, 5),   -- ultrasonic water level
  (8, 'Paratronic SU-11436 (temperature)', 'Paratronic', NULL, 1),   -- ultrasonic temperature channel
  (9, 'HOBO Pendant Event 050004770', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/ua-003-64', 9),   -- pluviometer AIR
  (10, 'HOBO Pendant Event 050005719', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/ua-003-64', 9),  -- pluviometer SOL
  (11, 'HOBO U23-001 (temperature)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001', 1),      -- temp/humidity logger - temp channel
  (12, 'HOBO U23-001 (humidity)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001', 2),         -- temp/humidity logger - humidity channel
  (13, 'HOBO U23-001 (dew point)', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u23-001', 10),       -- temp/humidity logger - dew point channel
  (14, 'HOBO Water Temp Pro v2 010029976', 'Onset', 'https://www.onsetcomp.com/products/data-loggers/u22-001', 1)  -- ground temperature probe
ON CONFLICT DO NOTHING;

-- Sensor configurations (deployment-specific settings)
INSERT INTO t_sensor_configuration (id, id_sensor, id_unit, precision_upper, precision_lower, resolution) VALUES
  (1, 1, 1, 0.5, 0.5, 0.01),    -- Tinytag temperature in °C
  (2, 2, 2, 3.0, 3.0, 0.3),     -- Tinytag humidity in %
  (3, 3, 5, 0.01, 0.01, 0.001), -- Keller water level in m
  (4, 4, 4, 50, 50, 1),          -- Vaisala CO2 in ppm
  -- Graners observatory sensor configurations
  (5, 5, 10, NULL, NULL, 1),     -- SU-14608 water level in mm (raw distance)
  (6, 6, 9, NULL, NULL, 0.01),   -- SU-14608 temperature in K (centi-Kelvin raw)
  (7, 7, 10, NULL, NULL, 1),     -- SU-11436 water level in mm (raw distance)
  (8, 8, 9, NULL, NULL, 0.01),   -- SU-11436 temperature in K (centi-Kelvin raw)
  (9, 9, 11, NULL, NULL, 1),     -- Pluviometer AIR in event counts
  (10, 10, 11, NULL, NULL, 1),   -- Pluviometer SOL in event counts
  (11, 11, 1, 0.21, 0.21, 0.02), -- HOBO U23 temperature in °C
  (12, 12, 2, 2.5, 2.5, 0.1),   -- HOBO U23 humidity in %
  (13, 13, 1, NULL, NULL, 0.1),  -- HOBO U23 dew point in °C
  (14, 14, 1, 0.2, 0.2, 0.02)   -- HOBO Water Temp Pro ground temp in °C
ON CONFLICT DO NOTHING;

-- Observation points (using existing cave id=5 from mock data)
INSERT INTO t_point (id, id_author, label, latitude, longitude, point_geom, id_cave) VALUES
  (1, 1, 'Salle principale - Station A', 62.798492610654286, 78.5377653268393, ST_SetSRID(ST_MakePoint(78.5377653268393, 62.798492610654286), 4326), 5),
  (2, 1, 'Rivière souterraine - Amont', 62.799100000000000, 78.538200000000000, ST_SetSRID(ST_MakePoint(78.538200000000000, 62.799100000000000), 4326), 5),
  (3, 1, 'Entrée - Station météo', 62.797800000000000, 78.537000000000000, ST_SetSRID(ST_MakePoint(78.537000000000000, 62.797800000000000), 4326), NULL)
ON CONFLICT DO NOTHING;

-- Observations
INSERT INTO t_observation (id, id_author, observation_date, id_point, id_cave, id_observation_type, observation_type_code, point_label, latitude, longitude) VALUES
  (1, 1, '2025-06-01 10:00:00', 1, 5, 2, 'physical_measurements', 'Salle principale - Station A', 62.798492610654286, 78.5377653268393),
  (2, 1, '2025-06-01 10:00:00', 2, 5, 2, 'physical_measurements', 'Rivière souterraine - Amont', 62.799100000000000, 78.538200000000000),
  (3, 1, '2025-06-15 08:00:00', 1, 5, 1, 'pollution', 'Salle principale - Station A', 62.798492610654286, 78.5377653268393),
  (4, 1, '2025-07-01 09:00:00', 3, NULL, 2, 'physical_measurements', 'Entrée - Station météo', 62.797800000000000, 78.537000000000000)
ON CONFLICT DO NOTHING;

-- Time series
INSERT INTO t_time_series (id, id_author, id_observation, id_sensor_configuration, id_medium, sampling_interval_seconds, start_date, end_date, measurement_count, min_value, max_value, data_quality, quantity_kind_code, unit_symbol, medium_code) VALUES
  (1, 1, 1, 1, 2, 900, '2025-06-01 00:00:00', '2025-08-31 23:45:00', 8832, 8.2, 9.8, 'validated', 'Temperature', '°C', 'air'),
  (2, 1, 1, 2, 2, 900, '2025-06-01 00:00:00', '2025-08-31 23:45:00', 8832, 92.0, 99.5, 'validated', 'RelativeHumidity', '%', 'air'),
  (3, 1, 2, 3, 1, 600, '2025-06-01 00:00:00', '2025-08-31 23:50:00', 13248, 0.15, 2.30, 'raw', 'WaterLevel', 'm', 'water'),
  (4, 1, 4, 1, 2, 900, '2025-06-01 00:00:00', '2025-08-31 23:45:00', 8832, -5.0, 32.0, 'raw', 'Temperature', '°C', 'air'),
  (5, 1, 4, 4, 2, 1800, '2025-06-01 00:00:00', '2025-08-31 23:30:00', 4416, 400, 2500, 'raw', 'CO2Concentration', 'ppm', 'air')
ON CONFLICT DO NOTHING;

-- Generate demo measurements for time series 1 (temperature in cave, Jun-Aug 2025)
-- Simulates stable cave temperature ~9°C with small daily variation
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

-- Generate demo measurements for time series 2 (humidity in cave, Jun-Aug 2025)
-- Simulates high stable humidity ~96% with small variation
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

-- Generate demo measurements for time series 3 (water level, Jun-Aug 2025)
-- Simulates rising/falling water with rain events
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

-- Generate demo measurements for time series 4 (outdoor temperature, Jun-Aug 2025)
-- Simulates outdoor temp with daily cycle and seasonal warming
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

-- Generate demo measurements for time series 5 (CO2 concentration, Jun-Aug 2025)
-- Simulates CO2 buildup during night, ventilation during day
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

-- Contamination record
INSERT INTO t_contamination (id, id_author, id_observation, id_contaminant_type, id_medium, medium_code) VALUES
  (1, 1, 3, 5, 1, 'water')
ON CONFLICT DO NOTHING;

-- Human activity record
INSERT INTO t_human_activity (id, id_author, id_observation, id_human_activity_type) VALUES
  (1, 1, 3, 15)
ON CONFLICT DO NOTHING;

-- Update sequences
SELECT setval('t_observation_type_id_seq', (SELECT MAX(id) FROM t_observation_type));
SELECT setval('t_quantity_kind_id_seq', (SELECT MAX(id) FROM t_quantity_kind));
SELECT setval('t_unit_id_seq', (SELECT MAX(id) FROM t_unit));
SELECT setval('t_medium_id_seq', (SELECT MAX(id) FROM t_medium));
SELECT setval('t_method_id_seq', (SELECT MAX(id) FROM t_method));
SELECT setval('t_human_activity_type_id_seq', (SELECT MAX(id) FROM t_human_activity_type));
SELECT setval('t_contaminant_type_id_seq', (SELECT MAX(id) FROM t_contaminant_type));
SELECT setval('t_point_id_seq', (SELECT MAX(id) FROM t_point));
SELECT setval('t_observation_id_seq', (SELECT MAX(id) FROM t_observation));
SELECT setval('t_sensor_id_seq', (SELECT MAX(id) FROM t_sensor));
SELECT setval('t_sensor_configuration_id_seq', (SELECT MAX(id) FROM t_sensor_configuration));
SELECT setval('t_time_series_id_seq', (SELECT MAX(id) FROM t_time_series));
SELECT setval('t_contamination_id_seq', (SELECT MAX(id) FROM t_contamination));
SELECT setval('t_human_activity_id_seq', (SELECT MAX(id) FROM t_human_activity));
