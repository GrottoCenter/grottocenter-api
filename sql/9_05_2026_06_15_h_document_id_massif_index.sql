\c grottoce;

-- Add index on h_document.id_massif to avoid seq scans during FK constraint checks.
-- The composite PK (id, date_reviewed) does not help queries filtering only on id_massif.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_h_document_id_massif
    ON h_document (id_massif);
