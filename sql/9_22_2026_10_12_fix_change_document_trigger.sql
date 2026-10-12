\c grottoce;

-- =============================================================================
-- Fix #1781: recent changes list document updates that did not happen
-- =============================================================================
--
-- change_document() logged an 'update' for every UPDATE of a validated
-- document, attributed to COALESCE(id_reviewer, id_author). A contribution to a
-- document is only applied when a moderator validates it, so that rule also
-- matched every write the application makes to a document as a side effect of
-- another action, none of which sets id_reviewer:
--   - deleting or merging a cave rewrites id_cave (TDocument.cave is a
--     one-to-many association, so TCave.addToCollection / .set({documents})
--     update t_document);
--   - linking a document to a cave, entrance or massif bumps date_reviewed;
--   - permanently deleting a document or a massif rewrites id_parent,
--     redirect_to, id_authorization_document or id_massif on other documents.
-- Each one showed up as "<last reviewer of the document> updated <document>",
-- an edit that never happened, credited to someone who took no action.
--
-- A document change is now logged when it becomes visible, that is when the
-- row goes from not validated to validated:
--   - 'create' when the document has never been reviewed (validation of a new
--     submission), credited to its author. This restores the label lost when
--     #1772 switched the 'create' branch to TG_OP = 'INSERT': a document is
--     inserted unvalidated, so its creation was logged as an 'update'.
--   - 'update' otherwise (validation of a contribution, whose author
--     multiple-validate.js writes to id_reviewer), credited to the reviewer.
-- INSERT of an already validated document, delete and restore are unchanged.
--
-- Rejecting a pending change (manually, or automatically in
-- multiple-validate.js) also sets is_validated back to true, with the same
-- write as accepting a new submission, so the trigger cannot tell the two
-- apart. The rejection writes run in a transaction that sets
-- app.document_skip_log, and the function returns early on it, like the
-- app.relevance_swap_skip_log guard of the sub-entity triggers (#1772).
-- =============================================================================

CREATE OR REPLACE FUNCTION change_document() RETURNS trigger AS $$
DECLARE type_change varchar(20);
DECLARE id_author int4;
DECLARE entity_name text;
BEGIN
IF current_setting('app.document_skip_log', true) = 'true' THEN RETURN NEW; END IF;
type_change := '';
if TG_OP = 'INSERT' then
    type_change := 'create';
    id_author := NEW.id_author;
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = true then
    type_change := 'delete';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted != OLD.is_deleted AND NEW.is_deleted = false then
    type_change := 'restore';
    id_author := COALESCE(NEW.id_reviewer, NEW.id_author);
elsif NEW.is_deleted = false AND OLD.is_validated IS DISTINCT FROM true AND NEW.is_validated = true then
    if NEW.id_reviewer is null then
        type_change := 'create';
        id_author := NEW.id_author;
    else
        type_change := 'update';
        id_author := NEW.id_reviewer;
    end if;
end if;
-- Only validated documents are public
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

ALTER FUNCTION change_document() OWNER TO gc_owner;
