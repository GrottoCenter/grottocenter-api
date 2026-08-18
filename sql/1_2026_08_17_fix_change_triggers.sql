\c grottoce;

-- =============================================================================
-- Fix #1772: change_* triggers misclassify relevance swaps as 'create' events
-- =============================================================================
--
-- Root cause: the original trigger logic used
--   "NEW.is_deleted = false AND NEW.id_reviewer IS NULL"
-- to detect a row creation.  This condition is true for ANY UPDATE where the
-- reviewer has not yet been set — including pure relevance swaps — causing
-- displaced sub-entities to be logged as newly created by their original author.
--
-- Fix 1: replace the condition with TG_OP = 'INSERT', which is unambiguously
-- true only when the row is being inserted for the first time.  This mirrors
-- the already-correct change_guideline() implementation.
--
-- Fix 2: add a session-variable guard at the top of each function so that
-- RelevanceService can suppress the t_last_change entry for the involuntarily
-- displaced neighbor (the entity whose relevance is swapped as a side-effect).
-- The guard reads a transaction-scoped flag (SET LOCAL) that the application
-- sets only for the neighbor update.  This pattern is already used by
-- EnrichmentQueueService (app.is_enrichment).
--
-- Affected functions: change_grotto, change_massif, change_cave,
--   change_entrance, change_document, change_history, change_location,
--   change_comment, change_description, change_rigging.
-- (change_guideline already uses TG_OP = 'INSERT' and is unchanged.)
--
-- Note: the relevance_swap_skip_log guard is applied only to the five
-- sub-entity triggers (change_history, change_location, change_comment,
-- change_description, change_rigging) that correspond to ENTITY_CONFIG in
-- RelevanceService.  The top-level triggers (change_grotto, change_massif,
-- change_cave, change_entrance, change_document) have no relevance column
-- and are never touched by RelevanceService.moveRelevance, so no guard is
-- needed there.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- change_grotto
-- -----------------------------------------------------------------------------
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
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_massif
-- -----------------------------------------------------------------------------
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
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_cave
-- -----------------------------------------------------------------------------
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
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_entrance
-- -----------------------------------------------------------------------------
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
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_document
-- -----------------------------------------------------------------------------
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
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' AND NEW.is_validated = true then
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

-- -----------------------------------------------------------------------------
-- change_history
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_history() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_location
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_location() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_comment
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_comment() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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

-- -----------------------------------------------------------------------------
-- change_description
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_description() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE type_related_entity varchar(20);
DECLARE id_related_entity int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
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

-- -----------------------------------------------------------------------------
-- change_rigging
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION change_rigging() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.relevance_swap_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted = false then
    type_change := 'update';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
end if;
if type_change != '' then
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
