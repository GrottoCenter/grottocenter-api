\c grottoce;

-- =============================================================================
-- #1961: keep t_point.point_geom in sync with latitude/longitude
-- =============================================================================
--
-- t_point.point_geom (sql/9_04_2026_06_03_scientific_observations_ddl.sql) was
-- only written by the seed. Points are now created, moved and cleared through
-- the API, which writes latitude and longitude only: like t_entrance
-- (set_entrance_point_geom, sql/0_triggers.sql), the geometry is derived from
-- them on every INSERT and UPDATE, and NULL when the pair is incomplete.
--
-- Production does not run migrations on deploy: apply this file by hand, with
-- 9_33_2026_11_03_point_svg_position.sql, BEFORE deploying the API.
-- Idempotent.
-- =============================================================================

-- Already there in every database built from sql/; added for the test database,
-- whose t_point is built from the Waterline model.
ALTER TABLE t_point ADD COLUMN IF NOT EXISTS point_geom geometry(Point, 4326);

CREATE OR REPLACE FUNCTION set_point_point_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.point_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point_geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
ALTER FUNCTION set_point_point_geom() OWNER TO gc_owner;

DROP TRIGGER IF EXISTS set_point_point_geom_trigger ON t_point;
CREATE TRIGGER set_point_point_geom_trigger
  BEFORE INSERT OR UPDATE ON t_point
  FOR EACH ROW
  EXECUTE PROCEDURE set_point_point_geom();

-- Realign the existing rows. The no-op assignment fires the trigger, which
-- recomputes the geometry.
UPDATE t_point
SET latitude = latitude
WHERE point_geom IS DISTINCT FROM (
  CASE
    WHEN longitude IS NOT NULL AND latitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  END
);
