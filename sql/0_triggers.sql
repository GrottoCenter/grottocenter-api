-----------------------------------------------------------
-- Create trigger in Postgre
-- Version v1.0 - 20210204 - B. Soufflet - V. Verdon
------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calcule_size_coef()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    coef int2 := 0;
begin
    IF new.depth IS NOT NULL THEN
				IF new.depth < 20
                THEN
                    --rien
                ELSEIF new.depth <= 200
                THEN
                    coef := coef + 4;
                ELSE
                    coef := coef + 5;
				END IF;
    END IF;
    IF new.length IS NOT NULL THEN
                IF new.length < 20
                THEN
                    --rien
				ELSEIF new.length <= 200
                THEN
                    coef := coef + 1;
				ELSEIF new.length <= 500
                THEN
                    coef := coef + 2;
				ELSEIF new.length <= 5000
                THEN
                    coef := coef + 4;
				ELSE
                    coef := coef + 5;
				END IF;
    END IF;

    new.size_coef := coef;

return new;
end;
$function$
;

CREATE TRIGGER size_coef_insert_update
BEFORE INSERT OR UPDATE
ON public.t_cave for each row execute function calcule_size_coef();

--Procédure d'historisation suite à DELETE déclenchée par le trigger
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_delete() RETURNS trigger AS $$
DECLARE
    date_r timestamp;

BEGIN
    --on update la table t_ pour déclarer l'enregistrement deleted
    --évidemment ça provoque l'exécution du trigger sur update !
    EXECUTE format('UPDATE %I.%I SET is_deleted = true WHERE id = $1.id', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    USING OLD;
    --on retourne null afin de ne pas faire le delete
    RETURN null;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Table: h_grotto
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_grotto() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_grotto (id, id_author, id_reviewer, village, county, region, city, postal_code, address, mail, year_birth, date_inscription, date_reviewed, latitude, longitude, custom_message, is_official_partner, url, id_country, picture_file_name)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.village, OLD.county, OLD.region, OLD.city, OLD.postal_code, OLD.address, OLD.mail, OLD.year_birth, OLD.date_inscription, date_r, OLD.latitude, OLD.longitude, OLD.custom_message, OLD.is_official_partner, OLD.url, OLD.id_country, OLD.picture_file_name);
    end if;
    --on insert la valeur de la date de modification dans t_grotto
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_grotto
BEFORE UPDATE
ON t_grotto
FOR EACH ROW
EXECUTE PROCEDURE histo_update_grotto();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_grotto
BEFORE DELETE
ON t_grotto
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();


------------------------------------------------------------
-- Table: h_massif
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_massif() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_massif (id, id_author, id_reviewer, date_inscription, date_reviewed, geog_polygon)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.geog_polygon);
    end if;
    --on insert la valeur de la date de modification dans t_massif
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_massif
BEFORE UPDATE
ON t_massif
FOR EACH ROW
EXECUTE PROCEDURE histo_update_massif();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_massif
BEFORE DELETE
ON t_massif
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_cave
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_cave() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_cave (id, id_author, id_reviewer, min_depth, max_depth, "depth", length, is_diving, temperature, size_coef, date_inscription, date_reviewed, longitude, latitude, id_massif)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.min_depth, OLD.max_depth, OLD."depth", OLD.length, OLD.is_diving, OLD.temperature, OLD.size_coef, OLD.date_inscription, date_r, OLD.longitude, OLD.latitude, OLD.id_massif);
    end if;
    --on insert la valeur de la date de modification dans t_cave
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_cave
BEFORE UPDATE
ON t_cave
FOR EACH ROW
EXECUTE PROCEDURE histo_update_cave();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_cave
BEFORE DELETE
ON t_cave
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_entrance
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_entrance() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_entrance (id, "type", id_author, id_reviewer, region, county, village, city, address, year_discovery, external_url, date_inscription, date_reviewed, is_public, is_sensitive, contact, modalities, has_contributions, latitude, longitude, altitude, is_of_interest, id_cave, id_country, id_geology)
        VALUES (OLD.id, OLD."type", OLD.id_author, OLD.id_reviewer, OLD.region, OLD.county, OLD.village, OLD.city, OLD.address, OLD.year_discovery, OLD.external_url, OLD.date_inscription, date_r, OLD.is_public, OLD.is_sensitive, OLD.contact, OLD.modalities, OLD.has_contributions, OLD.latitude, OLD.longitude, OLD.altitude, OLD.is_of_interest, OLD.id_cave, OLD.id_country, OLD.id_geology);
    end if;
    --on insert la valeur de la date de modification dans t_entrance
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_entrance
BEFORE UPDATE
ON t_entrance
FOR EACH ROW
EXECUTE PROCEDURE histo_update_entrance();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_entrance
BEFORE DELETE
ON t_entrance
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();


------------------------------------------------------------
-- Table: h_document
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_document() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_document (id, id_author, id_reviewer, id_validator, date_inscription, date_validation, date_publication, is_validated, validation_comment, pages, identifier, issue, id_identifier_type, ref_bbs, id_entrance, id_massif, id_cave, id_author_caver, id_author_grotto, id_editor, id_library, id_type, id_parent, id_license, pages_bbs_old, comments_bbs_old, publication_other_bbs_old, publication_fascicule_bbs_old, author_comment, date_reviewed)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.id_validator, OLD.date_inscription, OLD.date_validation, OLD.date_publication, OLD.is_validated, OLD.validation_comment, OLD.pages, OLD.identifier, OLD.issue, OLD.id_identifier_type, OLD.ref_bbs, OLD.id_entrance, OLD.id_massif, OLD.id_cave, OLD.id_author_caver, OLD.id_author_grotto, OLD.id_editor, OLD.id_library, OLD.id_type, OLD.id_parent, OLD.id_license, OLD.pages_bbs_old, OLD.comments_bbs_old, OLD.publication_other_bbs_old, OLD.publication_fascicule_bbs_old, OLD.author_comment, date_r);
    end if;
    --on insert la valeur de la date de modification dans t_document
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_document
BEFORE UPDATE
ON t_document
FOR EACH ROW
EXECUTE PROCEDURE histo_update_document();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_document
BEFORE DELETE
ON t_document
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_history
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_history() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_history (id, id_author, id_reviewer, date_inscription, date_reviewed, relevance, body, id_cave, id_entrance, id_point, id_language)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.relevance, OLD.body, OLD.id_cave, OLD.id_entrance, OLD.id_point, OLD.id_language);
    end if;
    --on insert la valeur de la date de modification dans t_history
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_history
BEFORE UPDATE
ON t_history
FOR EACH ROW
EXECUTE PROCEDURE histo_update_history();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_history
BEFORE DELETE
ON t_history
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_location
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_location() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_location (id,id_author,id_reviewer,date_inscription,date_reviewed,relevance,body,id_entrance,id_language)
        VALUES (OLD.id,OLD.id_author,OLD.id_reviewer,OLD.date_inscription, date_r,OLD.relevance,OLD.body,OLD.id_entrance,OLD.id_language);
    end if;
    --on insert la valeur de la date de modification dans t_location
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_location
BEFORE UPDATE
ON t_location
FOR EACH ROW
EXECUTE PROCEDURE histo_update_location();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_location
BEFORE DELETE
ON t_location
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_name
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_name() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_name (id, "name", is_main, id_author, id_reviewer, date_inscription, date_reviewed, id_language, id_entrance, id_cave, id_massif, id_point, id_grotto)
        VALUES (OLD.id, OLD."name", OLD.is_main, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.id_language, OLD.id_entrance, OLD.id_cave, OLD.id_massif, OLD.id_point, OLD.id_grotto);
    end if;
    --on insert la valeur de la date de modification dans t_name
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_name
BEFORE UPDATE
ON t_name
FOR EACH ROW
EXECUTE PROCEDURE histo_update_name();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_name
BEFORE DELETE
ON t_name
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_comment
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_comment() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_comment (id, id_author, id_reviewer, date_inscription, date_reviewed, relevance, e_t_underground, e_t_trail, aestheticism, caving, approach, title, body, alert, id_cave, id_entrance, id_exit, id_language)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.relevance, OLD.e_t_underground, OLD.e_t_trail, OLD.aestheticism, OLD.caving, OLD.approach, OLD.title, OLD.body, OLD.alert, OLD.id_cave, OLD.id_entrance, OLD.id_exit, OLD.id_language);
    end if;
    --on insert la valeur de la date de modification dans t_comment
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_comment
BEFORE UPDATE
ON t_comment
FOR EACH ROW
EXECUTE PROCEDURE histo_update_comment();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_comment
BEFORE DELETE
ON t_comment
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_description
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_description() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_description (id, id_author, id_reviewer, date_inscription, date_reviewed, relevance, title, body, id_cave, id_entrance, id_exit, id_massif, id_point, id_document, id_language)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.relevance, OLD.title, OLD.body, OLD.id_cave, OLD.id_entrance, OLD.id_exit, OLD.id_massif, OLD.id_point, OLD.id_document, OLD.id_language);
    end if;
    --on insert la valeur de la date de modification dans t_description
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_description
BEFORE UPDATE
ON t_description
FOR EACH ROW
EXECUTE PROCEDURE histo_update_description();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_description
BEFORE DELETE
ON t_description
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();

------------------------------------------------------------
-- Table: h_rigging
------------------------------------------------------------
--Historisation suite à UPDATE déclenchée par le trigger
--La procédure met aussi à jour date_reviewed
---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION histo_update_rigging() RETURNS trigger AS $$
DECLARE
    date_r timestamp;
BEGIN
    --prise en compte du cas de la première modif d'un enregistrement
    if new.date_reviewed is null then
        date_r := NEW.date_inscription;
    else
        date_r := NEW.date_reviewed;
    end if;
    --si is_deleted change d'état c'est qu'on est face à une suppression ou une réactivation de la ligne, donc on n'historise pas !
    if NEW.is_deleted = OLD.is_deleted then
        --copie dans la table d'historisation
        INSERT INTO h_rigging (id, id_author, id_reviewer, date_inscription, date_reviewed, relevance, title, obstacles, ropes, anchors, observations, id_entrance, id_exit, id_point, id_language)
        VALUES (OLD.id, OLD.id_author, OLD.id_reviewer, OLD.date_inscription, date_r, OLD.relevance, OLD.title, OLD.obstacles, OLD.ropes, OLD.anchors, OLD.observations, OLD.id_entrance, OLD.id_exit, OLD.id_point, OLD.id_language);
    end if;
    --on insert la valeur de la date de modification dans t_rigging
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--trigger qui exécute l'historisation lors d'un UPDATE
--------------------------------------------------------
CREATE TRIGGER histo_update_rigging
BEFORE UPDATE
ON t_rigging
FOR EACH ROW
EXECUTE PROCEDURE histo_update_rigging();

--trigger qui exécute l'historisation lors d'un DELETE
--------------------------------------------------------
CREATE TRIGGER histo_delete_rigging
BEFORE DELETE
ON t_rigging
FOR EACH ROW
EXECUTE PROCEDURE histo_delete();
