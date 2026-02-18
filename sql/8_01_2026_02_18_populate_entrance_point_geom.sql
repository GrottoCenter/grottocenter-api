\c grottoce;

-- Populate point_geom for all entrances that have longitude and latitude
-- This is needed for spatial queries like ST_Contains used in massif filtering

UPDATE t_entrance 
SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) 
WHERE longitude IS NOT NULL 
  AND latitude IS NOT NULL 
  AND point_geom IS NULL;
