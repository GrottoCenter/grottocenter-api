\c grottoce;

-- ============================================================
-- Scientific Observations Lookup / Enumeration Data
-- Required in all environments (production, staging, local)
-- ============================================================

BEGIN;

-- ============================================================
-- Observation types
-- ============================================================
INSERT INTO t_observation_type (id, code, url) VALUES
  (1, 'pollution', 'https://ontology.uis-speleo.org/ontology/#pollution'),
  (2, 'physical_measurements', 'http://www.w3.org/ns/sosa/Observation'),
  (3, 'biospeleological_observation', 'https://dwc.tdwg.org/list/#dwc_Occurrence'),
  (4, 'human_activities', 'https://ontology.uis-speleo.org/ontology/#humanActivities')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Quantity kinds (QUDT)
-- ============================================================
INSERT INTO t_quantity_kind (id, code, url, symbol_si, display_symbol, si_to_display_factor, si_to_display_offset) VALUES
  (1, 'Temperature', 'http://qudt.org/vocab/quantitykind/Temperature', 'K', '°C', 1, -273.15),
  (2, 'RelativeHumidity', 'http://qudt.org/vocab/quantitykind/RelativeHumidity', '1', '%', 100, 0),
  (3, 'AtmosphericPressure', 'http://qudt.org/vocab/quantitykind/AtmosphericPressure', 'Pa', 'hPa', 0.01, 0),
  (4, 'CO2Concentration', 'http://qudt.org/vocab/quantitykind/MoleFraction', 'mol/mol', 'ppm', 1000000, 0),
  (5, 'WaterLevel', 'http://qudt.org/vocab/quantitykind/Length', 'm', 'm', 1, 0),
  (6, 'WaterFlow', 'http://qudt.org/vocab/quantitykind/VolumeFlowRate', 'm³/s', 'm³/s', 1, 0),
  (7, 'Conductivity', 'http://qudt.org/vocab/quantitykind/Conductivity', 'S/m', 'µS/cm', 10000, 0),
  (8, 'pH', 'http://qudt.org/vocab/quantitykind/PH', 'pH', 'pH', 1, 0),
  (9, 'Precipitation', 'http://qudt.org/vocab/quantitykind/LiquidPrecipitation', 'm', 'mm', 1000, 0),
  (10, 'DewPointTemperature', 'http://qudt.org/vocab/quantitykind/DewPointTemperature', 'K', '°C', 1, -273.15),
  (11, 'DissolvedOxygen', 'http://qudt.org/vocab/quantitykind/MassFraction', 'mg/L', 'mg/L', 1, 0),
  (12, 'TotalDissolvedSolids', 'http://qudt.org/vocab/quantitykind/MassConcentration', 'mg/L', 'mg/L', 1, 0),
  (13, 'Salinity', 'http://qudt.org/vocab/quantitykind/Dimensionless', 'PSU', 'PSU', 1, 0),
  (14, 'Turbidity', 'http://qudt.org/vocab/quantitykind/Turbidity', 'NTU', 'NTU', 1, 0),
  (15, 'RedoxPotential', 'http://qudt.org/vocab/quantitykind/ElectricPotential', 'V', 'mV', 1000, 0),
  (16, 'Resistivity', 'http://qudt.org/vocab/quantitykind/Resistivity', 'Ω·m', 'Ω·cm', 100, 0),
  (17, 'Concentration', 'http://qudt.org/vocab/quantitykind/AmountOfSubstanceConcentration', 'mol/L', 'µM', 1000000, 0),
  (18, 'LightIntensity', 'http://qudt.org/vocab/quantitykind/Illuminance', 'lx', 'lx', 1, 0),
  (19, 'AirVelocity', 'http://qudt.org/vocab/quantitykind/Speed', 'm/s', 'm/s', 1, 0),
  (20, 'WaterVelocity', 'http://qudt.org/vocab/quantitykind/Speed', 'm/s', 'm/s', 1, 0),
  (21, 'RadonConcentration', 'http://qudt.org/vocab/quantitykind/ActivityConcentration', 'Bq/m³', 'Bq/m³', 1, 0),
  (22, 'IsotopeDelta', 'http://qudt.org/vocab/quantitykind/DimensionlessRatio', '1', '‰', 1000, 0)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Units
-- ============================================================
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
  (11, 'event_count', 'count'),
  (12, 'degree_fahrenheit', '°F'),
  (13, 'millibar', 'mbar'),
  (14, 'pascal', 'Pa'),
  (15, 'kilopascal', 'kPa'),
  (16, 'milligram_per_liter', 'mg/L'),
  (17, 'microgram_per_liter', 'µg/L'),
  (18, 'micromole', 'µM'),
  (19, 'nephelometric_turbidity_unit', 'NTU'),
  (20, 'ohm_centimeter', 'Ω·cm'),
  (21, 'practical_salinity_unit', 'PSU'),
  (22, 'millivolt', 'mV'),
  (23, 'centimeter', 'cm'),
  (24, 'cubic_meter_per_second', 'm³/s'),
  (25, 'lux', 'lx'),
  (26, 'becquerel_per_cubic_meter', 'Bq/m³'),
  (27, 'meter_per_second', 'm/s'),
  (28, 'decibel', 'dB'),
  (29, 'per_mil', '‰')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Media
-- ============================================================
INSERT INTO t_medium (id, code, url) VALUES
  (1, 'water', 'http://purl.obolibrary.org/obo/ENVO_00002006'),
  (2, 'air', 'http://purl.obolibrary.org/obo/ENVO_00002005'),
  (3, 'soil', 'http://purl.obolibrary.org/obo/ENVO_00001998'),
  (4, 'sediment', 'http://purl.obolibrary.org/obo/ENVO_00002007'),
  (5, 'cave_wall', 'http://purl.obolibrary.org/obo/ENVO_00002144')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Human activity types
-- ============================================================
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

-- ============================================================
-- Contaminant types
-- ============================================================
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
-- Update lookup sequences
-- ============================================================
SELECT setval('t_observation_type_id_seq', (SELECT MAX(id) FROM t_observation_type));
SELECT setval('t_quantity_kind_id_seq', (SELECT MAX(id) FROM t_quantity_kind));
SELECT setval('t_unit_id_seq', (SELECT MAX(id) FROM t_unit));
SELECT setval('t_medium_id_seq', (SELECT MAX(id) FROM t_medium));
SELECT setval('t_human_activity_type_id_seq', (SELECT MAX(id) FROM t_human_activity_type));
SELECT setval('t_contaminant_type_id_seq', (SELECT MAX(id) FROM t_contaminant_type));

COMMIT;
