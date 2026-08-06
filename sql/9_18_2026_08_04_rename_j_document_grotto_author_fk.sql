\c grottoce;

-- =============================================================================
-- Rename FK constraint on j_document_grotto_author (Item D)
-- =============================================================================
-- The old name j_document_grotto_author_t_caver_fk was wrong: the FK references
-- t_grotto, not t_caver. This is a cosmetic correction with no functional impact.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'j_document_grotto_author_t_caver_fk'
  ) THEN
    ALTER TABLE j_document_grotto_author
      RENAME CONSTRAINT j_document_grotto_author_t_caver_fk
      TO j_document_grotto_author_t_grotto_fk;
  END IF;
END $$;
