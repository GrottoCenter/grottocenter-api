\c grottoce;

-- =============================================================================
-- #1699: three countries were placed on a homonym
-- =============================================================================
--
-- t_country.latitude/longitude centre the map of a country page. Three rows of
-- sql/2_2021_09_22_4_countries.sql had been geocoded from the English name and
-- landed on another place of that name:
--
--   GE  Georgia   32.157, -82.907  the US state of Georgia
--   VA  Holy See  30.034, -95.812  a place in Texas
--   SO  Somalia    9.987,  45.299  Somaliland, the north of the country
--
-- They get the centre of the country, from the same source as the other rows
-- (FR 46.227638, 2.213749; US 37.09024, -95.712891). The seed is fixed too, for
-- fresh databases.
--
-- Only a row still holding the wrong value is changed: a coordinate corrected
-- by hand in the meantime is kept. Idempotent.
--
-- Production does not run migrations on deploy: apply this file by hand.
-- =============================================================================

UPDATE t_country
SET latitude = 42.315407, longitude = 43.356892
WHERE iso = 'GE' AND latitude = 32.1574351 AND longitude = -82.907123;

UPDATE t_country
SET latitude = 41.902916, longitude = 12.453389
WHERE iso = 'VA' AND latitude = 30.0337427 AND longitude = -95.8116677;

UPDATE t_country
SET latitude = 5.152149, longitude = 46.199616
WHERE iso = 'SO' AND latitude = 9.9869867 AND longitude = 45.2993862;
