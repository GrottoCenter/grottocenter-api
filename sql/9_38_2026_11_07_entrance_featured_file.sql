\c grottoce;

-- =============================================================================
-- #1701: featured picture of an entrance
-- =============================================================================
--
-- An entrance may feature one image file of a document linked to it. The file
-- is referenced rather than its document, as a document may hold several
-- images. Existing entrances feature no file.
--
-- The API checks that the file is still eligible (validated image of a linked,
-- displayable document) each time it serves the entrance, so a column left
-- pointing at a file that became ineligible is never exposed. Deleting the
-- file clears the column.
--
-- h_entrance does not keep the selection: it is presentation, not data about
-- the cave, and the history trigger lists its columns explicitly.
--
-- Apply before deploying the API: Waterline selects this column explicitly.
-- =============================================================================

ALTER TABLE t_entrance ADD COLUMN IF NOT EXISTS id_featured_file int4 NULL DEFAULT NULL;

ALTER TABLE t_entrance DROP CONSTRAINT IF EXISTS t_entrance_featured_file_fk;
ALTER TABLE t_entrance
  ADD CONSTRAINT t_entrance_featured_file_fk FOREIGN KEY (id_featured_file)
  REFERENCES t_file(id) ON DELETE SET NULL;

-- Serves the ON DELETE SET NULL lookup when a file is deleted.
CREATE INDEX IF NOT EXISTS idx_t_entrance_featured_file
  ON t_entrance(id_featured_file) WHERE id_featured_file IS NOT NULL;
