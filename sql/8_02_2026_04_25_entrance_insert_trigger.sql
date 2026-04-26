\c grottoce;

-- Consolidate point_geom maintenance into a single BEFORE INSERT OR UPDATE
-- trigger, replacing the previous UPDATE-only logic in histo_update_entrance()
-- and the INSERT-only set_entrance_geom_on_insert trigger.
--
-- Changes:
-- 1. set_entrance_point_geom() now handles both INSERT and UPDATE with a NULL guard
-- 2. The old INSERT-only trigger (set_entrance_geom_on_insert) is dropped
-- 3. A new BEFORE INSERT OR UPDATE trigger replaces it
-- 4. The duplicated point_geom line in histo_update_entrance() is removed

-- Step 1: Replace the trigger function with NULL-guarded version
CREATE OR REPLACE FUNCTION set_entrance_point_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.point_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point_geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop the old INSERT-only trigger (if it exists from a previous deployment)
DROP TRIGGER IF EXISTS set_entrance_geom_on_insert ON t_entrance;

-- Step 3: Create the new BEFORE INSERT OR UPDATE trigger
CREATE OR REPLACE TRIGGER set_entrance_point_geom_trigger
  BEFORE INSERT OR UPDATE ON t_entrance
  FOR EACH ROW
  EXECUTE PROCEDURE set_entrance_point_geom();

-- Step 4: Remove the point_geom assignment from histo_update_entrance().
-- We recreate the entire function without the duplicated line.
-- The history INSERT and date_reviewed logic remain unchanged.
CREATE OR REPLACE FUNCTION histo_update_entrance() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_entrance (
        id,
        "type",
        id_author,
        id_reviewer,
        region,
        county,
        city,
        iso_3166_2,
        year_discovery,
        external_url,
        date_inscription,
        date_reviewed,
        is_public,
        is_sensitive,
        contact,
        modalities,
        has_contributions,
        latitude,
        longitude,
        altitude,
        is_of_interest,
        id_cave,
        id_country,
        id_geology
    )
VALUES (
        OLD.id,
        OLD."type",
        OLD.id_author,
        OLD.id_reviewer,
        OLD.region,
        OLD.county,
        OLD.city,
        OLD.iso_3166_2,
        OLD.year_discovery,
        OLD.external_url,
        OLD.date_inscription,
        date_r,
        OLD.is_public,
        OLD.is_sensitive,
        OLD.contact,
        OLD.modalities,
        OLD.has_contributions,
        OLD.latitude,
        OLD.longitude,
        OLD.altitude,
        OLD.is_of_interest,
        OLD.id_cave,
        OLD.id_country,
        OLD.id_geology
    );
end if;
--on insert la valeur de la date de modification dans t_entrance
NEW.date_reviewed := now();

-- point_geom is now maintained by the set_entrance_point_geom trigger
-- (BEFORE INSERT OR UPDATE), so no duplication here.
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
