\c grottoce;

-- =============================================================================
-- #2007: per-file panorama display setting
-- =============================================================================
--
-- t_file.is_panorama tells the front end to open a file in its 360-degree
-- viewer. It holds the effective choice: detected from the GPano metadata of a
-- new upload, or set by a contributor through the document edit workflow.
-- Existing files start as regular files (false); there is no backfill.
--
-- Apply before deploying the API: Waterline selects this column explicitly.
-- Idempotent.
-- =============================================================================

ALTER TABLE t_file ADD COLUMN IF NOT EXISTS is_panorama boolean NOT NULL DEFAULT false;
