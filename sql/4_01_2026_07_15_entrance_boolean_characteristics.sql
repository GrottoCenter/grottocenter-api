\c grottoce;

BEGIN;

-- Add nine boolean characteristic columns to t_entrance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'has_bat'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN has_bat bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'danger_flooding'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN danger_flooding bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'danger_co2'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN danger_co2 bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'danger_rockfall'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN danger_rockfall bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'danger_pollution'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN danger_pollution bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'need_clean_gear'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN need_clean_gear bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'need_stay_on_trail'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN need_stay_on_trail bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'has_rules'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN has_rules bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 't_entrance' AND column_name = 'is_touristic'
    ) THEN
        ALTER TABLE t_entrance ADD COLUMN is_touristic bool NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add nine boolean characteristic columns to h_entrance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'has_bat'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN has_bat bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'danger_flooding'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN danger_flooding bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'danger_co2'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN danger_co2 bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'danger_rockfall'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN danger_rockfall bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'danger_pollution'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN danger_pollution bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'need_clean_gear'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN need_clean_gear bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'need_stay_on_trail'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN need_stay_on_trail bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'has_rules'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN has_rules bool NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'h_entrance' AND column_name = 'is_touristic'
    ) THEN
        ALTER TABLE h_entrance ADD COLUMN is_touristic bool NOT NULL DEFAULT false;
    END IF;
END $$;

COMMIT;
