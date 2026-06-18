\c grottoce;

-- ============================================================
-- Migration: Pre-seed speleology-relevant substances
--
-- Inserts 22 commonly measured substances in cave water
-- chemistry and isotope geochemistry. Uses ON CONFLICT DO
-- NOTHING to ensure idempotence (safe to run multiple times).
--
-- id_author = 1 (system/admin user)
-- external_id = PubChem CID (as string) where available
-- external_source = 'PubChem' when external_id is set, NULL otherwise
-- ============================================================

BEGIN;

INSERT INTO t_substance (name, formula, cas_number, external_id, external_source, id_author)
VALUES
  -- Major anions and cations
  ('Nitrate',           'NO3-',       '14797-55-8',  '943',     'PubChem', 1),
  ('Nitrite',           'NO2-',       '14797-65-0',  '946',     'PubChem', 1),
  ('Ammonium',          'NH4+',       '14798-03-9',  '223',     'PubChem', 1),
  ('Phosphate',         'PO4(3-)',    '14265-44-2',  '1061',    'PubChem', 1),
  ('Silicate',          'SiO4(4-)',   '17181-37-2',  NULL,      NULL,      1),
  ('Calcium',           'Ca2+',       '14127-61-8',  '5460341', 'PubChem', 1),
  ('Magnesium',         'Mg2+',       '7439-95-4',   '5462224', 'PubChem', 1),
  ('Sodium',            'Na+',        '17341-25-2',  '923',     'PubChem', 1),
  ('Potassium',         'K+',         '24203-36-9',  '813',     'PubChem', 1),
  ('Chloride',          'Cl-',        '16887-00-6',  '312',     'PubChem', 1),
  ('Sulfate',           'SO4(2-)',    '14808-79-8',  '1117',    'PubChem', 1),
  ('Bicarbonate',       'HCO3-',      '71-52-3',     '769',     'PubChem', 1),

  -- Dissolved gases
  ('Dissolved Oxygen',  'O2',         '7782-44-7',   '977',     'PubChem', 1),
  ('Carbon Dioxide',    'CO2',        '124-38-9',    '280',     'PubChem', 1),
  ('Radon',             'Rn',         '10043-92-2',  '24857',   'PubChem', 1),

  -- Trace metals
  ('Iron',              'Fe2+/Fe3+',  '7439-89-6',   '23925',   'PubChem', 1),
  ('Manganese',         'Mn2+',       '7439-96-5',   '23930',   'PubChem', 1),
  ('Strontium',         'Sr2+',       '7440-24-6',   '5359327', 'PubChem', 1),
  ('Barium',            'Ba2+',       '7440-39-3',   '5355457', 'PubChem', 1),

  -- Stable isotope ratios (no formula, CAS, or PubChem CID)
  ('δ¹⁸O',             NULL,          NULL,          NULL,      NULL,      1),
  ('δ²H',              NULL,          NULL,          NULL,      NULL,      1),
  ('δ¹³C',             NULL,          NULL,          NULL,      NULL,      1)
ON CONFLICT (LOWER(name)) DO NOTHING;

-- ============================================================
-- Link existing sensor configurations and time series to
-- t_substance based on substance_label (case-insensitive match).
-- Safe to run multiple times: only updates rows where id_substance IS NULL.
-- ============================================================

UPDATE t_sensor_configuration sc
SET id_substance = s.id
FROM t_substance s
WHERE LOWER(sc.substance_label) = LOWER(s.name)
  AND sc.id_substance IS NULL;

UPDATE t_time_series ts
SET id_substance = s.id
FROM t_substance s
WHERE LOWER(ts.substance_label) = LOWER(s.name)
  AND ts.id_substance IS NULL;

COMMIT;
