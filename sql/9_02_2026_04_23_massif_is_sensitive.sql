\c grottoce;

BEGIN;

-- Add is_sensitive column to t_massif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_massif' AND column_name = 'is_sensitive'
    ) THEN
        ALTER TABLE t_massif ADD COLUMN is_sensitive bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add is_sensitive column to h_massif
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_massif' AND column_name = 'is_sensitive'
    ) THEN
        ALTER TABLE h_massif ADD COLUMN is_sensitive bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Update the history trigger to include is_sensitive
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
            is_sensitive
        )
        VALUES (
            OLD.id,
            OLD.id_author,
            OLD.id_reviewer,
            OLD.date_inscription,
            date_r,
            OLD.geog_polygon,
            OLD.is_sensitive
        );
    end if;

    -- Update modification date in the main table
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
