\c grottoce;

-- =============================================================================
-- #1806: a controlled type for every organization
-- =============================================================================
--
-- Organizations that exist before this migration keep a NULL type ("not set"):
-- nothing in the data tells a caving club from a publisher. The API requires a
-- type to create an organization and never writes NULL itself. The values
-- match config/constants/organization.js.
--
-- Apply after sql/9_22_2026_10_12_search_outbox.sql: the end of this file
-- replaces the t_grotto triggers it creates.
-- =============================================================================

ALTER TABLE t_grotto ADD COLUMN IF NOT EXISTS type varchar(32) NULL;
ALTER TABLE h_grotto ADD COLUMN IF NOT EXISTS type varchar(32) NULL;

ALTER TABLE t_grotto DROP CONSTRAINT IF EXISTS t_grotto_type_check;
ALTER TABLE t_grotto ADD CONSTRAINT t_grotto_type_check CHECK (
  type IS NULL OR type IN ('SPELEOLOGY', 'CAVE_RESCUE', 'EDITION', 'RESEARCH', 'ADMINISTRATION', 'NATURE_CONSERVATION', 'LIBRARY')
);

-- The history keeps the type an organization had before each change
CREATE OR REPLACE FUNCTION histo_update_grotto() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_grotto (
        id,
        id_author,
        id_reviewer,
        county,
        region,
        city,
        iso_3166_2,
        postal_code,
        address,
        mail,
        year_birth,
        date_inscription,
        date_reviewed,
        latitude,
        longitude,
        custom_message,
        is_official_partner,
        url,
        id_country,
        picture_file_name,
        type
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.county,
        OLD.region,
        OLD.city,
        OLD.iso_3166_2,
        OLD.postal_code,
        OLD.address,
        OLD.mail,
        OLD.year_birth,
        OLD.date_inscription,
        date_r,
        OLD.latitude,
        OLD.longitude,
        OLD.custom_message,
        OLD.is_official_partner,
        OLD.url,
        OLD.id_country,
        OLD.picture_file_name,
        OLD.type
    );
end if;
--on insert la valeur de la date de modification dans t_grotto
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION histo_update_grotto() OWNER TO gc_owner;

-- Documents embed the type of their editor, library and author organizations
-- in the search index: record the previous type so that a change re-indexes
-- them (api/dbSync/searchOutbox.js), as is_deleted and redirect_to already do.
-- Mirrors sql/9_22_2026_10_12_search_outbox.sql, which this replaces for t_grotto.
CREATE OR REPLACE TRIGGER search_outbox_insert_delete
  AFTER INSERT OR DELETE ON t_grotto FOR EACH ROW
  EXECUTE FUNCTION search_outbox_enqueue('organization', 'is_deleted', 'redirect_to', 'type');
CREATE OR REPLACE TRIGGER search_outbox_update
  AFTER UPDATE ON t_grotto FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION search_outbox_enqueue('organization', 'is_deleted', 'redirect_to', 'type');
