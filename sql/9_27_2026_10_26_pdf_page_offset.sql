\c grottoce;

-- =============================================================================
-- #1936: PDF page offsets for document URL identifiers and attached files
-- =============================================================================
--
-- Printed page numbers often differ from positions in a PDF (cover, front
-- matter, extract of a larger publication). One optional signed offset per PDF
-- source lets a client open the right page while the bibliographic pages stay
-- as printed:
--
--   PDF position = printed page number + offset
--
-- t_document.identifier_pdf_page_offset applies to the PDF URL stored in
-- identifier (id_identifier_type 'url'); t_file.pdf_page_offset to each
-- attached PDF. NULL means no configured offset; 0 is a configured offset.
-- h_document keeps the identifier offset in the document history.
--
-- Apply before deploying the API: Waterline selects these columns explicitly.
-- =============================================================================

ALTER TABLE t_document ADD COLUMN IF NOT EXISTS identifier_pdf_page_offset integer NULL;
ALTER TABLE h_document ADD COLUMN IF NOT EXISTS identifier_pdf_page_offset integer NULL;
ALTER TABLE t_file ADD COLUMN IF NOT EXISTS pdf_page_offset integer NULL;

CREATE OR REPLACE FUNCTION histo_update_document() RETURNS trigger AS $$
DECLARE date_r timestamp;
BEGIN
    -- Handle first modification case
    IF new.date_reviewed IS NULL THEN
        date_r := NEW.date_inscription;
    ELSE
        date_r := NEW.date_reviewed;
    END IF;

    -- Only historize if is_deleted state hasn't changed
    IF NEW.is_deleted = OLD.is_deleted THEN
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
            identifier_pdf_page_offset,
            issue,
            id_identifier_type,
            ref_bbs,
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
            OLD.identifier_pdf_page_offset,
            OLD.issue,
            OLD.id_identifier_type,
            OLD.ref_bbs,
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
    END IF;

    -- Update date_reviewed
    NEW.date_reviewed := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
ALTER FUNCTION histo_update_document() OWNER TO gc_owner;
