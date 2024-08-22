-----------------------------------------------------------
-- Create trigger in Postgre
-- Version v1.0 - 20210204 - B. Soufflet - V. Verdon
------------------------------------------------------------
\c grottoce;
--
CREATE OR REPLACE FUNCTION calcule_size_coef() RETURNS trigger LANGUAGE plpgsql AS $function$
declare coef int2 := 0;
begin IF new.depth IS NOT NULL THEN IF new.depth < 20 THEN --rien
ELSEIF new.depth <= 200 THEN coef := coef + 4;
ELSE coef := coef + 5;
END IF;
END IF;
IF new.length IS NOT NULL THEN IF new.length < 20 THEN --rien
ELSEIF new.length <= 200 THEN coef := coef + 1;
ELSEIF new.length <= 500 THEN coef := coef + 2;
ELSEIF new.length <= 5000 THEN coef := coef + 4;
ELSE coef := coef + 5;
END IF;
END IF;
new.size_coef := coef;
return new;
end;
$function$;
CREATE OR REPLACE TRIGGER size_coef_insert_update BEFORE INSERT OR UPDATE ON t_cave for each row execute function calcule_size_coef();
--
--Procédure d'historisation suite à DELETE déclenchée par le trigger
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_delete() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN

-- Hard delete when the row was alreay deleted
if OLD.is_deleted = true then
RETURN OLD;
end if;

--Soft delete, on update la table t_ pour déclarer l'enregistrement deleted
--évidemment ça provoque l'exécution du trigger sur update !
EXECUTE format(
    'UPDATE %I.%I SET is_deleted = true WHERE id = $1.id',
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME
) USING OLD;
--on retourne null afin de ne pas faire le delete
RETURN null;
END;
$$ LANGUAGE plpgsql;
--
--
------------------------------------------------------------
-- Table: h_grotto
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
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
        picture_file_name
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
        OLD.picture_file_name
    );
end if;
--on insert la valeur de la date de modification dans t_grotto
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_grotto() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de la grotto associé (dans le cas d'un INSERT le name n'est pas encore créé il sera donc null)
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_grotto = NEW.id LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'grotto',
        type_change,
        now(),
        NEW.id,
        id_author,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_grotto BEFORE UPDATE ON t_grotto FOR EACH ROW EXECUTE PROCEDURE histo_update_grotto();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_grotto BEFORE DELETE ON t_grotto FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_grotto BEFORE INSERT OR UPDATE ON t_grotto FOR EACH ROW EXECUTE PROCEDURE change_grotto();
--
--
------------------------------------------------------------
-- Table: h_massif
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_massif() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_massif (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        geog_polygon
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.geog_polygon
    );
end if;
--on insert la valeur de la date de modification dans t_massif
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_massif() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom du massif associé (dans le cas d'un INSERT le name n'est pas encore créé il sera donc null)
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_massif = NEW.id LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'massif',
        type_change,
        now(),
        NEW.id,
        id_author,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_massif BEFORE UPDATE ON t_massif FOR EACH ROW EXECUTE PROCEDURE histo_update_massif();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_massif BEFORE DELETE ON t_massif FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_massif BEFORE INSERT OR UPDATE ON t_massif FOR EACH ROW EXECUTE PROCEDURE change_massif();
--
--
------------------------------------------------------------
-- Table: h_cave
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_cave() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_cave (
        id,
        id_author,
        id_reviewer,
        min_depth,
        max_depth,
        "depth",
        length,
        is_diving,
        temperature,
        size_coef,
        date_inscription,
        date_reviewed,
        longitude,
        latitude
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.min_depth,
        OLD.max_depth,
        OLD."depth",
        OLD.length,
        OLD.is_diving,
        OLD.temperature,
        OLD.size_coef,
        OLD.date_inscription,
        date_r,
        OLD.longitude,
        OLD.latitude
    );
end if;
--on insert la valeur de la date de modification dans t_cave
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_cave() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de la cave associée (dans le cas d'un INSERT le name n'est pas encore créé il sera donc null)
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_cave = NEW.id LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'cave',
        type_change,
        now(),
        NEW.id,
        id_author,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_cave BEFORE UPDATE ON t_cave FOR EACH ROW EXECUTE PROCEDURE histo_update_cave();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_cave BEFORE DELETE ON t_cave FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_cave BEFORE INSERT OR UPDATE ON t_cave FOR EACH ROW EXECUTE PROCEDURE change_cave();
--
--
------------------------------------------------------------
-- Table: h_entrance
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
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
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_entrance() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de l'entrance associée (dans le cas d'un INSERT le name n'est pas encore créé il sera donc null)
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'entrance',
        type_change,
        now(),
        NEW.id,
        id_author,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_entrance BEFORE UPDATE ON t_entrance FOR EACH ROW EXECUTE PROCEDURE histo_update_entrance();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_entrance BEFORE DELETE ON t_entrance FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_entrance BEFORE INSERT OR UPDATE ON t_entrance FOR EACH ROW EXECUTE PROCEDURE change_entrance();
--
--
------------------------------------------------------------
-- Table: h_document
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_document() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_document (
        id,
        id_author,
        id_reviewer,
        id_validator,
        date_inscription,
        date_validation,
        date_publication,
        is_validated,
        validation_comment,
        pages,
        identifier,
        issue,
        id_identifier_type,
        ref_bbs,
        id_entrance,
        id_massif,
        id_cave,
        id_editor,
        id_library,
        id_type,
        id_parent,
        id_license,
        pages_bbs_old,
        comments_bbs_old,
        publication_other_bbs_old,
        publication_fascicule_bbs_old,
        author_comment,
        date_reviewed
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.id_validator,
        OLD.date_inscription,
        OLD.date_validation,
        OLD.date_publication,
        OLD.is_validated,
        OLD.validation_comment,
        OLD.pages,
        OLD.identifier,
        OLD.issue,
        OLD.id_identifier_type,
        OLD.ref_bbs,
        OLD.id_entrance,
        OLD.id_massif,
        OLD.id_cave,
        OLD.id_editor,
        OLD.id_library,
        OLD.id_type,
        OLD.id_parent,
        OLD.id_license,
        OLD.pages_bbs_old,
        OLD.comments_bbs_old,
        OLD.publication_other_bbs_old,
        OLD.publication_fascicule_bbs_old,
        OLD.author_comment,
        date_r
    );
end if;
--on insert la valeur de la date de modification dans t_document
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_document() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
-- Les changements d'un document ne sont sauvegardé que lorsqu'ils sont validés
if type_change != '' AND NEW.is_validated = true then
-- Récupère le nom du document associé (dans le cas d'un INSERT le name n'est pas encore créé il sera donc null)
SELECT tdesc.title INTO entity_name FROM t_description tdesc WHERE tdesc.id_document = NEW.id LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        name
    )
VALUES (
        'document',
        type_change,
        now(),
        NEW.id,
        id_author,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_document BEFORE UPDATE ON t_document FOR EACH ROW EXECUTE PROCEDURE histo_update_document();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_document BEFORE DELETE ON t_document FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_document BEFORE INSERT OR UPDATE ON t_document FOR EACH ROW EXECUTE PROCEDURE change_document();
--
--
------------------------------------------------------------
-- Table: h_history
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_history() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_history (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        body,
        id_cave,
        id_entrance,
        id_point,
        id_language
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.body,
        OLD.id_cave,
        OLD.id_entrance,
        OLD.id_point,
        OLD.id_language
    );
end if;
--on insert la valeur de la date de modification dans t_history
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_history() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de l'entrance associé
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'history',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_history BEFORE UPDATE ON t_history FOR EACH ROW EXECUTE PROCEDURE histo_update_history();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_history BEFORE DELETE ON t_history FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_history BEFORE INSERT OR UPDATE ON t_history FOR EACH ROW EXECUTE PROCEDURE change_history();
--
--
------------------------------------------------------------
-- Table: h_location
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_location() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_location (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        body,
        title,
        id_entrance,
        id_language
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.body,
        OLD.title,
        OLD.id_entrance,
        OLD.id_language
    );
end if;
--on insert la valeur de la date de modification dans t_location
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_location() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de l'entrance associé
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'location',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_location BEFORE UPDATE ON t_location FOR EACH ROW EXECUTE PROCEDURE histo_update_location();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_location BEFORE DELETE ON t_location FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_location BEFORE INSERT OR UPDATE ON t_location FOR EACH ROW EXECUTE PROCEDURE change_location();
--
--
------------------------------------------------------------
-- Table: h_name
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_name() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
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
        id_grotto
    )
VALUES (
        OLD.id,
        OLD."name",
        OLD.is_main,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.id_language,
        OLD.id_entrance,
        OLD.id_cave,
        OLD.id_massif,
        OLD.id_point,
        OLD.id_grotto
    );
end if;
--on insert la valeur de la date de modification dans t_name
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_name BEFORE UPDATE ON t_name FOR EACH ROW EXECUTE PROCEDURE histo_update_name();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_name BEFORE DELETE ON t_name FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--
--
------------------------------------------------------------
-- Table: h_comment
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_comment() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_comment (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        e_t_underground,
        e_t_trail,
        aestheticism,
        caving,
        approach,
        title,
        body,
        alert,
        id_cave,
        id_entrance,
        id_exit,
        id_language
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.e_t_underground,
        OLD.e_t_trail,
        OLD.aestheticism,
        OLD.caving,
        OLD.approach,
        OLD.title,
        OLD.body,
        OLD.alert,
        OLD.id_cave,
        OLD.id_entrance,
        OLD.id_exit,
        OLD.id_language
    );
end if;
--on insert la valeur de la date de modification dans t_comment
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_comment() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de l'entrance associé
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'comment',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_comment BEFORE UPDATE ON t_comment FOR EACH ROW EXECUTE PROCEDURE histo_update_comment();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_comment BEFORE DELETE ON t_comment FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_comment BEFORE INSERT OR UPDATE ON t_comment FOR EACH ROW EXECUTE PROCEDURE change_comment();
--
--
------------------------------------------------------------
-- Table: h_description
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_description() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_description (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        title,
        body,
        id_cave,
        id_entrance,
        id_exit,
        id_massif,
        id_point,
        id_document,
        id_language
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.title,
        OLD.body,
        OLD.id_cave,
        OLD.id_entrance,
        OLD.id_exit,
        OLD.id_massif,
        OLD.id_point,
        OLD.id_document,
        OLD.id_language
    );
end if;
--on insert la valeur de la date de modification dans t_description
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_description() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE type_related_entity varchar(20);
DECLARE id_related_entity int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
-- Les descriptions des documents comptabilisés comme changement car elles correspondent à leur nom
if type_change != '' AND NEW.id_document is null then

if NEW.id_cave is not null then
type_related_entity := 'cave';
id_related_entity := NEW.id_cave;
elsif NEW.id_entrance is not null then
type_related_entity := 'entrance';
id_related_entity := NEW.id_entrance;
elsif NEW.id_massif is not null then
type_related_entity := 'massif';
id_related_entity := NEW.id_massif;
end if;
-- Récupère le nom de la cave ou l'entrance ou le massif associé
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND (tname.id_cave = NEW.id_cave OR tname.id_entrance = NEW.id_entrance OR tname.id_massif = NEW.id_massif) LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'description',
        type_change,
        now(),
        NEW.id,
        id_author,
        type_related_entity,
        id_related_entity,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_description BEFORE UPDATE ON t_description FOR EACH ROW EXECUTE PROCEDURE histo_update_description();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_description BEFORE DELETE ON t_description FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_description BEFORE INSERT OR UPDATE ON t_description FOR EACH ROW EXECUTE PROCEDURE change_description();
--
--
------------------------------------------------------------
-- Table: h_rigging
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_rigging() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN --prise en compte du cas de la première modif d'un enregistrement
if new.date_reviewed is null then date_r := NEW.date_inscription;
else date_r := NEW.date_reviewed;
end if;
--si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
if NEW.is_deleted = OLD.is_deleted then --copie dans la table d'historisation
INSERT INTO h_rigging (
        id,
        id_author,
        id_reviewer,
        date_inscription,
        date_reviewed,
        relevance,
        title,
        obstacles,
        ropes,
        anchors,
        observations,
        id_entrance,
        id_exit,
        id_point,
        id_language
    )
VALUES (
        OLD.id,
        OLD.id_author,
        OLD.id_reviewer,
        OLD.date_inscription,
        date_r,
        OLD.relevance,
        OLD.title,
        OLD.obstacles,
        OLD.ropes,
        OLD.anchors,
        OLD.observations,
        OLD.id_entrance,
        OLD.id_exit,
        OLD.id_point,
        OLD.id_language
    );
end if;
--on insert la valeur de la date de modification dans t_rigging
NEW.date_reviewed := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--
--Sauvegarde des derniers changements dans la table t_last_change
-------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_rigging() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND NEW.id_reviewer is null then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
-- Récupère le nom de l'entrance associé
SELECT tname.name INTO entity_name FROM t_name tname WHERE tname.is_main = true AND tname.id_entrance = NEW.id_entrance LIMIT 1;
INSERT INTO t_last_change (
        type_entity,
        type_change,
        date_change,
        id_entity,
        id_author,
        type_related_entity,
        id_related_entity,
        name
    )
VALUES (
        'rigging',
        type_change,
        now(),
        NEW.id,
        id_author,
        'entrance',
        NEW.id_entrance,
        entity_name
    );
end if;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_update_rigging BEFORE UPDATE ON t_rigging FOR EACH ROW EXECUTE PROCEDURE histo_update_rigging();
--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER histo_delete_rigging BEFORE DELETE ON t_rigging FOR EACH ROW EXECUTE PROCEDURE histo_delete();
--trigger qui exécute la sauvegarde des derniers changements lors d'un CREATE ou d'un UPDATE
--------------------------------------------------------
CREATE OR REPLACE TRIGGER last_change_rigging BEFORE INSERT OR UPDATE ON t_rigging FOR EACH ROW EXECUTE PROCEDURE change_rigging();