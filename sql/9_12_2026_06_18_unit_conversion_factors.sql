\c grottoce;

-- ============================================================
-- Migration: Move SI-to-display conversion factors from
-- t_quantity_kind to t_unit (issue #1690)
--
-- The conversion factor/offset semantically belongs on the unit,
-- not the quantity kind. A unit knows how to convert itself to/from
-- SI regardless of which physical quantity is being measured.
--
-- Semantics on t_unit (unchanged column names for DB compatibility):
--   value_display = value_si * factor_to_si + offset_to_si
--   value_si = (value_display - offset_to_si) / factor_to_si
--
-- Note: The DB column names factor_to_si / offset_to_si are historical.
-- The application layer exposes them as siToDisplayFactor / siToDisplayOffset
-- which correctly describes the direction: FROM SI TO display unit.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Add conversion columns to t_unit
-- ============================================================
ALTER TABLE t_unit ADD COLUMN IF NOT EXISTS factor_to_si numeric NOT NULL DEFAULT 1;
ALTER TABLE t_unit ADD COLUMN IF NOT EXISTS offset_to_si numeric NOT NULL DEFAULT 0;

-- ============================================================
-- 2. Populate t_unit conversion factors from known mappings
--
-- The naming convention: factor_to_si / offset_to_si
-- Formula: value_display = value_si * factor_to_si + offset_to_si
-- Inverse: value_si = (value_display - offset_to_si) / factor_to_si
-- ============================================================

-- degree_celsius (°C): T_display = T_si * 1 + (-273.15)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = -273.15 WHERE code = 'degree_celsius';

-- percent (%): V_display = V_si * 100
UPDATE t_unit SET factor_to_si = 100, offset_to_si = 0 WHERE code = 'percent';

-- hectopascal (hPa): P_display = P_si * 0.01
UPDATE t_unit SET factor_to_si = 0.01, offset_to_si = 0 WHERE code = 'hectopascal';

-- parts_per_million (ppm): C_display = C_si * 1000000
UPDATE t_unit SET factor_to_si = 1000000, offset_to_si = 0 WHERE code = 'parts_per_million';

-- meter (m): identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'meter';

-- liter_per_second (L/s): Q_display = Q_si * 1000 (m³/s → L/s)
UPDATE t_unit SET factor_to_si = 1000, offset_to_si = 0 WHERE code = 'liter_per_second';

-- microsiemens_per_centimeter (µS/cm): σ_display = σ_si * 10000 (S/m → µS/cm)
UPDATE t_unit SET factor_to_si = 10000, offset_to_si = 0 WHERE code = 'microsiemens_per_centimeter';

-- ph_unit: identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'ph_unit';

-- kelvin (K): identity (SI unit itself)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'kelvin';

-- millimeter (mm): L_display = L_si * 1000 (m → mm)
UPDATE t_unit SET factor_to_si = 1000, offset_to_si = 0 WHERE code = 'millimeter';

-- event_count: identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'event_count';

-- degree_fahrenheit (°F): T_display = T_si * 1.8 + (-459.67)
-- Formula from K: °F = K × 9/5 − 459.67
UPDATE t_unit SET factor_to_si = 1.8, offset_to_si = -459.67 WHERE code = 'degree_fahrenheit';

-- millibar (mbar): P_display = P_si * 0.01 (same as hPa)
UPDATE t_unit SET factor_to_si = 0.01, offset_to_si = 0 WHERE code = 'millibar';

-- pascal (Pa): identity (SI unit)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'pascal';

-- kilopascal (kPa): P_display = P_si * 0.001
UPDATE t_unit SET factor_to_si = 0.001, offset_to_si = 0 WHERE code = 'kilopascal';

-- milligram_per_liter (mg/L): identity for mass concentration
-- (SI for mass concentration is kg/m³ = g/L, but mg/L is the conventional SI-adjacent unit here)
-- In the current system, DissolvedOxygen and TotalDissolvedSolids use mg/L as both SI and display
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'milligram_per_liter';

-- microgram_per_liter (µg/L): C_display = C_si * 1000 (mg/L → µg/L)
UPDATE t_unit SET factor_to_si = 1000, offset_to_si = 0 WHERE code = 'microgram_per_liter';

-- micromole (µM): C_display = C_si * 1000000 (mol/L → µM)
UPDATE t_unit SET factor_to_si = 1000000, offset_to_si = 0 WHERE code = 'micromole';

-- nephelometric_turbidity_unit (NTU): identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'nephelometric_turbidity_unit';

-- ohm_centimeter (Ω·cm): ρ_display = ρ_si * 100 (Ω·m → Ω·cm)
UPDATE t_unit SET factor_to_si = 100, offset_to_si = 0 WHERE code = 'ohm_centimeter';

-- practical_salinity_unit (PSU): identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'practical_salinity_unit';

-- millivolt (mV): V_display = V_si * 1000 (V → mV)
UPDATE t_unit SET factor_to_si = 1000, offset_to_si = 0 WHERE code = 'millivolt';

-- centimeter (cm): L_display = L_si * 100 (m → cm)
UPDATE t_unit SET factor_to_si = 100, offset_to_si = 0 WHERE code = 'centimeter';

-- cubic_meter_per_second (m³/s): identity (SI unit)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'cubic_meter_per_second';

-- lux (lx): identity (SI unit)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'lux';

-- becquerel_per_cubic_meter (Bq/m³): identity
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'becquerel_per_cubic_meter';

-- meter_per_second (m/s): identity (SI unit)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'meter_per_second';

-- decibel (dB): identity (dimensionless ratio)
UPDATE t_unit SET factor_to_si = 1, offset_to_si = 0 WHERE code = 'decibel';

-- per_mil (‰): V_display = V_si * 1000
UPDATE t_unit SET factor_to_si = 1000, offset_to_si = 0 WHERE code = 'per_mil';

-- ============================================================
-- 3. Drop v_measurement_wide (depends on columns we're removing)
--    then remove conversion columns from t_quantity_kind
--    and add id_display_unit FK (preferred human-friendly unit per QK)
-- ============================================================
DROP VIEW IF EXISTS v_measurement_wide;

ALTER TABLE t_quantity_kind DROP COLUMN IF EXISTS display_symbol;
ALTER TABLE t_quantity_kind DROP COLUMN IF EXISTS si_to_display_factor;
ALTER TABLE t_quantity_kind DROP COLUMN IF EXISTS si_to_display_offset;

-- Add the display unit FK (the canonical human-friendly unit for each QK)
ALTER TABLE t_quantity_kind ADD COLUMN IF NOT EXISTS id_display_unit integer NULL;
ALTER TABLE t_quantity_kind
  DROP CONSTRAINT IF EXISTS t_quantity_kind_t_unit_fk;
ALTER TABLE t_quantity_kind
  ADD CONSTRAINT t_quantity_kind_t_unit_fk
    FOREIGN KEY (id_display_unit) REFERENCES t_unit(id);

-- Populate display unit for each quantity kind
-- (IDs reference the pre-compaction state: after 9_08, before this migration's step 4)
UPDATE t_quantity_kind SET id_display_unit = 1  WHERE code = 'Temperature';          -- °C
UPDATE t_quantity_kind SET id_display_unit = 2  WHERE code = 'RelativeHumidity';     -- %
UPDATE t_quantity_kind SET id_display_unit = 3  WHERE code = 'AtmosphericPressure';  -- hPa
UPDATE t_quantity_kind SET id_display_unit = 4  WHERE code = 'CO2Concentration';     -- ppm (will be deleted in step 4)
UPDATE t_quantity_kind SET id_display_unit = 5  WHERE code = 'WaterLevel';           -- m
UPDATE t_quantity_kind SET id_display_unit = 24 WHERE code = 'WaterFlow';            -- m³/s
UPDATE t_quantity_kind SET id_display_unit = 7  WHERE code = 'Conductivity';         -- µS/cm
UPDATE t_quantity_kind SET id_display_unit = 8  WHERE code = 'pH';                   -- pH
UPDATE t_quantity_kind SET id_display_unit = 10 WHERE code = 'Precipitation';        -- mm
UPDATE t_quantity_kind SET id_display_unit = 1  WHERE code = 'DewPointTemperature';  -- °C
UPDATE t_quantity_kind SET id_display_unit = 16 WHERE code = 'DissolvedOxygen';      -- mg/L (will be deleted in step 4)
UPDATE t_quantity_kind SET id_display_unit = 16 WHERE code = 'TotalDissolvedSolids'; -- mg/L (will be deleted in step 4)
UPDATE t_quantity_kind SET id_display_unit = 21 WHERE code = 'Salinity';             -- PSU
UPDATE t_quantity_kind SET id_display_unit = 19 WHERE code = 'Turbidity';            -- NTU
UPDATE t_quantity_kind SET id_display_unit = 22 WHERE code = 'RedoxPotential';       -- mV
UPDATE t_quantity_kind SET id_display_unit = 20 WHERE code = 'Resistivity';          -- Ω·cm
UPDATE t_quantity_kind SET id_display_unit = 18 WHERE code = 'Concentration';        -- µM
UPDATE t_quantity_kind SET id_display_unit = 25 WHERE code = 'LightIntensity';       -- lx
UPDATE t_quantity_kind SET id_display_unit = 27 WHERE code = 'AirVelocity';          -- m/s
UPDATE t_quantity_kind SET id_display_unit = 27 WHERE code = 'WaterVelocity';        -- m/s
UPDATE t_quantity_kind SET id_display_unit = 26 WHERE code = 'RadonConcentration';   -- Bq/m³ (will be deleted in step 4)
UPDATE t_quantity_kind SET id_display_unit = 29 WHERE code = 'IsotopeDelta';         -- ‰

-- Now make it NOT NULL (all rows populated)
ALTER TABLE t_quantity_kind ALTER COLUMN id_display_unit SET NOT NULL;

-- ============================================================
-- 4. Consolidate remaining substance-specific QKs into
--    Concentration + substance FK
--
-- CO2Concentration (id=4) → Concentration (id=17)
-- DissolvedOxygen (id=11) → Concentration (id=17)
-- TotalDissolvedSolids (id=12) → Concentration (id=17)
-- RadonConcentration (id=21) → Concentration (id=17)
--
-- Sensor configs and time series must get the substance FK/label
-- to preserve the information previously encoded in the QK code.
-- ============================================================

-- 4a. Set substance on sensor configurations that used substance-specific QKs
--     (only where substance is not already set)
UPDATE t_sensor_configuration
  SET id_substance = 14, substance_label = 'Carbon Dioxide'
  WHERE id_quantity_kind = 4 AND id_substance IS NULL;

UPDATE t_sensor_configuration
  SET id_substance = 13, substance_label = 'Dissolved Oxygen'
  WHERE id_quantity_kind = 11 AND id_substance IS NULL;

UPDATE t_sensor_configuration
  SET substance_label = 'TDS'
  WHERE id_quantity_kind = 12 AND id_substance IS NULL AND substance_label IS NULL;

UPDATE t_sensor_configuration
  SET id_substance = 15, substance_label = 'Radon'
  WHERE id_quantity_kind = 21 AND id_substance IS NULL;

-- 4b. Set substance on time series that used substance-specific QK codes
--     (only where substance is not already set)
UPDATE t_time_series
  SET id_substance = 14, substance_label = 'Carbon Dioxide'
  WHERE quantity_kind_code = 'CO2Concentration' AND id_substance IS NULL;

UPDATE t_time_series
  SET id_substance = 13, substance_label = 'Dissolved Oxygen'
  WHERE quantity_kind_code = 'DissolvedOxygen' AND id_substance IS NULL;

UPDATE t_time_series
  SET substance_label = 'TDS'
  WHERE quantity_kind_code = 'TotalDissolvedSolids' AND id_substance IS NULL AND substance_label IS NULL;

UPDATE t_time_series
  SET id_substance = 15, substance_label = 'Radon'
  WHERE quantity_kind_code = 'RadonConcentration' AND id_substance IS NULL;

-- 4c. Now reassign the QK FK on sensor configurations
UPDATE t_sensor_configuration SET id_quantity_kind = 17
WHERE id_quantity_kind IN (4, 11, 12, 21);

-- 4d. Update denormalized codes in time series
UPDATE t_time_series SET quantity_kind_code = 'Concentration'
WHERE quantity_kind_code IN ('CO2Concentration', 'DissolvedOxygen', 'TotalDissolvedSolids', 'RadonConcentration');

-- Make FK deferrable for ID reassignment
ALTER TABLE t_sensor_configuration
  DROP CONSTRAINT IF EXISTS t_sensor_configuration_t_quantity_kind_fk,
  ADD CONSTRAINT t_sensor_configuration_t_quantity_kind_fk
    FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id)
    DEFERRABLE INITIALLY IMMEDIATE;

SET CONSTRAINTS t_sensor_configuration_t_quantity_kind_fk DEFERRED;

-- Delete the consolidated QKs
DELETE FROM t_quantity_kind WHERE id = 4 AND code = 'CO2Concentration';
DELETE FROM t_quantity_kind WHERE id = 11 AND code = 'DissolvedOxygen';
DELETE FROM t_quantity_kind WHERE id = 12 AND code = 'TotalDissolvedSolids';
DELETE FROM t_quantity_kind WHERE id = 21 AND code = 'RadonConcentration';

-- Reassign IDs to fill gaps:
-- Current after deletions: 1,2,3,5,6,7,8,9,10,13,14,15,16,17,18,19,20,22
-- Target:                  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18
--
-- Shift: 5→4, 6→5, 7→6, 8→7, 9→8, 10→9, 13→10, 14→11, 15→12, 16→13,
--        17→14, 18→15, 19→16, 20→17, 22→18

-- Update FK references first
UPDATE t_sensor_configuration SET id_quantity_kind = 4 WHERE id_quantity_kind = 5;
UPDATE t_sensor_configuration SET id_quantity_kind = 5 WHERE id_quantity_kind = 6;
UPDATE t_sensor_configuration SET id_quantity_kind = 6 WHERE id_quantity_kind = 7;
UPDATE t_sensor_configuration SET id_quantity_kind = 7 WHERE id_quantity_kind = 8;
UPDATE t_sensor_configuration SET id_quantity_kind = 8 WHERE id_quantity_kind = 9;
UPDATE t_sensor_configuration SET id_quantity_kind = 9 WHERE id_quantity_kind = 10;
UPDATE t_sensor_configuration SET id_quantity_kind = 10 WHERE id_quantity_kind = 13;
UPDATE t_sensor_configuration SET id_quantity_kind = 11 WHERE id_quantity_kind = 14;
UPDATE t_sensor_configuration SET id_quantity_kind = 12 WHERE id_quantity_kind = 15;
UPDATE t_sensor_configuration SET id_quantity_kind = 13 WHERE id_quantity_kind = 16;
UPDATE t_sensor_configuration SET id_quantity_kind = 14 WHERE id_quantity_kind = 17;
UPDATE t_sensor_configuration SET id_quantity_kind = 15 WHERE id_quantity_kind = 18;
UPDATE t_sensor_configuration SET id_quantity_kind = 16 WHERE id_quantity_kind = 19;
UPDATE t_sensor_configuration SET id_quantity_kind = 17 WHERE id_quantity_kind = 20;
UPDATE t_sensor_configuration SET id_quantity_kind = 18 WHERE id_quantity_kind = 22;

-- Now shift the QK rows themselves
UPDATE t_quantity_kind SET id = 4 WHERE id = 5 AND code = 'WaterLevel';
UPDATE t_quantity_kind SET id = 5 WHERE id = 6 AND code = 'WaterFlow';
UPDATE t_quantity_kind SET id = 6 WHERE id = 7 AND code = 'Conductivity';
UPDATE t_quantity_kind SET id = 7 WHERE id = 8 AND code = 'pH';
UPDATE t_quantity_kind SET id = 8 WHERE id = 9 AND code = 'Precipitation';
UPDATE t_quantity_kind SET id = 9 WHERE id = 10 AND code = 'DewPointTemperature';
UPDATE t_quantity_kind SET id = 10 WHERE id = 13 AND code = 'Salinity';
UPDATE t_quantity_kind SET id = 11 WHERE id = 14 AND code = 'Turbidity';
UPDATE t_quantity_kind SET id = 12 WHERE id = 15 AND code = 'RedoxPotential';
UPDATE t_quantity_kind SET id = 13 WHERE id = 16 AND code = 'Resistivity';
UPDATE t_quantity_kind SET id = 14 WHERE id = 17 AND code = 'Concentration';
UPDATE t_quantity_kind SET id = 15 WHERE id = 18 AND code = 'LightIntensity';
UPDATE t_quantity_kind SET id = 16 WHERE id = 19 AND code = 'AirVelocity';
UPDATE t_quantity_kind SET id = 17 WHERE id = 20 AND code = 'WaterVelocity';
UPDATE t_quantity_kind SET id = 18 WHERE id = 22 AND code = 'IsotopeDelta';

-- Reset the sequence
SELECT setval('t_quantity_kind_id_seq', (SELECT MAX(id) FROM t_quantity_kind));

-- Resolve deferred constraints so the ALTER below can proceed
SET CONSTRAINTS t_sensor_configuration_t_quantity_kind_fk IMMEDIATE;

-- Restore FK constraint to NOT DEFERRABLE (original DDL definition)
ALTER TABLE t_sensor_configuration
  DROP CONSTRAINT t_sensor_configuration_t_quantity_kind_fk,
  ADD CONSTRAINT t_sensor_configuration_t_quantity_kind_fk
    FOREIGN KEY (id_quantity_kind) REFERENCES t_quantity_kind(id);

-- ============================================================
-- 5. Recreate v_measurement_wide using t_unit conversion factors
--    instead of t_quantity_kind (which no longer has them).
--    quantity_unit_display now uses the QK's canonical display unit
--    (e.g., always °C for Temperature, regardless of import unit).
-- ============================================================
CREATE VIEW v_measurement_wide AS
SELECT
  m.id AS measurement_id,
  m.value,
  m.value_si,
  m.value_si * du.factor_to_si + du.offset_to_si AS value_display,
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
LEFT JOIN t_unit du ON du.id = qk.id_display_unit
WHERE o.is_deleted = false
  AND ts.is_deleted = false;

COMMIT;
