\c grottoce;

-- =============================================================================
-- #1987: PUT /entrances/:id fails on the h_entrance key (id, date_reviewed)
-- =============================================================================
--
-- histo_update_entrance() copies the old row into h_entrance, keyed by the
-- date_reviewed of that row, then stamps the new row with now(). now() is the
-- start time of the transaction, so a second update of the same entrance in
-- one transaction writes a snapshot keyed by the date the first update has
-- just set, and leaves the row with that same date. From then on, every update
-- of the entrance tries to insert that key again and fails with a uniqueness
-- error: the entrance can no longer be edited.
--
-- A snapshot keyed by date D holds the state the entrance had from D on. When
-- the key already exists, it was written inside the transaction that set D,
-- before that transaction's last change: the state it holds was never
-- committed. The trigger now replaces it with the old row, which is the state
-- that actually followed D. This also repairs the entrances already stuck:
-- their next update succeeds and fixes their latest snapshot.
--
-- The function is otherwise unchanged from 9_17_2026_07_09_fix_history_triggers.
-- =============================================================================

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
    )
ON CONFLICT (id, date_reviewed) DO UPDATE SET
        "type" = EXCLUDED."type",
        id_author = EXCLUDED.id_author,
        id_reviewer = EXCLUDED.id_reviewer,
        region = EXCLUDED.region,
        county = EXCLUDED.county,
        city = EXCLUDED.city,
        iso_3166_2 = EXCLUDED.iso_3166_2,
        year_discovery = EXCLUDED.year_discovery,
        external_url = EXCLUDED.external_url,
        date_inscription = EXCLUDED.date_inscription,
        is_public = EXCLUDED.is_public,
        is_sensitive = EXCLUDED.is_sensitive,
        is_sensitive_locked = EXCLUDED.is_sensitive_locked,
        contact = EXCLUDED.contact,
        modalities = EXCLUDED.modalities,
        has_contributions = EXCLUDED.has_contributions,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        altitude = EXCLUDED.altitude,
        "precision" = EXCLUDED."precision",
        is_of_interest = EXCLUDED.is_of_interest,
        id_cave = EXCLUDED.id_cave,
        id_country = EXCLUDED.id_country,
        id_geology = EXCLUDED.id_geology,
        has_bat = EXCLUDED.has_bat,
        danger_flooding = EXCLUDED.danger_flooding,
        danger_co2 = EXCLUDED.danger_co2,
        danger_rockfall = EXCLUDED.danger_rockfall,
        danger_pollution = EXCLUDED.danger_pollution,
        need_clean_gear = EXCLUDED.need_clean_gear,
        need_stay_on_trail = EXCLUDED.need_stay_on_trail,
        has_rules = EXCLUDED.has_rules,
        is_touristic = EXCLUDED.is_touristic,
        is_enrichment = EXCLUDED.is_enrichment;
end if;

NEW.date_reviewed := now();
-- point_geom is maintained by the set_entrance_point_geom trigger
-- (BEFORE INSERT OR UPDATE), so no duplication here.
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION histo_update_entrance() OWNER TO gc_owner;
