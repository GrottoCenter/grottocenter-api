\c grottoce;

-- =============================================================================
-- Fix #1723: History triggers missing columns
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Add is_enrichment column to h_entrance for enrichment-originated snapshots
-- -----------------------------------------------------------------------------
ALTER TABLE h_entrance ADD COLUMN IF NOT EXISTS is_enrichment bool NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- 1. histo_update_entrance: add missing boolean columns, precision, and
--    is_enrichment (read from session variable set by the enrichment job)
--
-- The following columns exist in both t_entrance and h_entrance but were never
-- included in the trigger's INSERT statement:
--   has_bat, danger_flooding, danger_co2, danger_rockfall, danger_pollution,
--   need_clean_gear, need_stay_on_trail, has_rules, is_touristic,
--   is_sensitive_locked, precision
--
-- Note: existing h_entrance rows cannot be retroactively fixed — the data was
-- never captured. Only future snapshots will be correct.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION histo_update_entrance() RETURNS trigger AS $$
DECLARE
  date_r timestamp;
  v_is_enrichment bool;
BEGIN
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;

-- Read the session-scoped flag set by the enrichment job (SET LOCAL).
-- Returns 'false' for all non-enrichment callers (missing_ok = true).
v_is_enrichment := coalesce(current_setting('app.is_enrichment', true), 'false') = 'true';

if NEW.is_deleted = OLD.is_deleted then
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
        is_sensitive_locked,
        contact,
        modalities,
        has_contributions,
        latitude,
        longitude,
        altitude,
        "precision",
        is_of_interest,
        id_cave,
        id_country,
        id_geology,
        has_bat,
        danger_flooding,
        danger_co2,
        danger_rockfall,
        danger_pollution,
        need_clean_gear,
        need_stay_on_trail,
        has_rules,
        is_touristic,
        is_enrichment
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
        OLD.is_sensitive_locked,
        OLD.contact,
        OLD.modalities,
        OLD.has_contributions,
        OLD.latitude,
        OLD.longitude,
        OLD.altitude,
        OLD."precision",
        OLD.is_of_interest,
        OLD.id_cave,
        OLD.id_country,
        OLD.id_geology,
        OLD.has_bat,
        OLD.danger_flooding,
        OLD.danger_co2,
        OLD.danger_rockfall,
        OLD.danger_pollution,
        OLD.need_clean_gear,
        OLD.need_stay_on_trail,
        OLD.has_rules,
        OLD.is_touristic,
        v_is_enrichment
    );
end if;

NEW.date_reviewed := now();
-- point_geom is now maintained by the set_entrance_point_geom trigger
-- (BEFORE INSERT OR UPDATE), so no duplication here.
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. histo_update_name: store NEW.id_reviewer instead of OLD.id_reviewer
--
-- The person who performs a rename is NEW.id_reviewer (set by the application
-- before the UPDATE). OLD.id_reviewer is the reviewer of the previous version,
-- which is typically NULL for names that were never independently reviewed.
--
-- This means h_name rows will now record who made the change, not who approved
-- the previous version. The h_name.id_author still stores OLD.id_author
-- (the original name creator).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION histo_update_name() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;

if NEW.is_deleted = OLD.is_deleted then
INSERT INTO h_name (
        id,
        "name",
        is_main,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        id_language,
        id_entrance,
        id_cave,
        id_massif,
        id_point,
        id_grotto,
        id_observation
    )
VALUES (
        OLD.id,
        OLD."name",
        OLD.is_main,
        OLD.id_author,
        NEW.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.id_language,
        OLD.id_entrance,
        OLD.id_cave,
        OLD.id_massif,
        OLD.id_point,
        OLD.id_grotto,
        OLD.id_observation
    );
end if;

NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
