\c grottoce;

BEGIN;

-- Add is_sensitive_locked column to t_entrance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'is_sensitive_locked'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN is_sensitive_locked bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add is_sensitive_locked column to h_entrance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'is_sensitive_locked'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN is_sensitive_locked bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add is_sensitive_locked column to t_massif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_massif' AND column_name = 'is_sensitive_locked'
    ) THEN
        ALTER TABLE t_massif ADD COLUMN is_sensitive_locked bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add is_sensitive_locked column to h_massif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_massif' AND column_name = 'is_sensitive_locked'
    ) THEN
        ALTER TABLE h_massif ADD COLUMN is_sensitive_locked bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Update the entrance history trigger to archive is_sensitive_locked
-- (mirrors the existing is_sensitive handling)
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
        is_sensitive_locked,
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
        OLD.is_sensitive_locked,
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

-- Update the massif history trigger to archive is_sensitive_locked
CREATE OR REPLACE FUNCTION histo_update_massif() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
    -- Determine the reference date
    if new.date_reviewed is null then date_r := NEW.date_inscription;
    else date_r := NEW.date_reviewed;
    end if;

    -- Only archive if it's not a soft delete or restore (is_deleted hasn't changed)
    if NEW.is_deleted = OLD.is_deleted then
        INSERT INTO h_massif (
            id,
            id_author,
            id_reviewer,
            date_inscription,
            date_reviewed,
            geog_polygon,
            is_sensitive,
            is_sensitive_locked
        )
        VALUES (
            OLD.id,
            OLD.id_author,
            OLD.id_reviewer,
            OLD.date_inscription,
            date_r,
            OLD.geog_polygon,
            OLD.is_sensitive,
            OLD.is_sensitive_locked
        );
    end if;

    -- Update modification date in the main table
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
