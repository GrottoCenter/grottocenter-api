\c grottoce;

-- =============================================================================
-- #1766: t_bot_page_manifest.redirect_to, which rows are redirects
-- =============================================================================
--
-- A merged record keeps its old address alive with a small page that redirects
-- to the final target (`v_bot_redirect`). That page is a manifest row of the
-- old record's type and id, like a content page, so a consumer of the manifest
-- needs a way to tell the two apart:
--
--   redirect_to   NULL for a content page; for a redirect page, the id of the
--                 final target (same entity_type). Always NULL for the static
--                 extras.
--
-- Consumers:
--   - the sitemaps (#1767) list only the rows where redirect_to IS NULL: a
--     redirect page is noindex;
--   - the withdrawal worker (#1886) and the audit (#1887) re-render the rows
--     where redirect_to IS NULL from v_bot_page; a redirect row has no
--     v_bot_page row, and is checked against v_bot_redirect.
--
-- No redirect row predates this column: redirect pages ship in the same change
-- (#1766), so every row already in the table is a content page or a static
-- extra, and NULL is right for all of them. (The generator writes the column
-- only with an upload, and skips a row whose content hash is unchanged, so it
-- would not fix a stale redirect row by itself.)
--
-- Production does not run migrations on deploy: apply this file by hand, after
-- sql/9_32_2026_11_02_bot_page_manifest.sql. Idempotent.
-- =============================================================================

ALTER TABLE t_bot_page_manifest ADD COLUMN IF NOT EXISTS redirect_to integer;

ALTER TABLE t_bot_page_manifest
  DROP CONSTRAINT IF EXISTS t_bot_page_manifest_redirect_to_check;
ALTER TABLE t_bot_page_manifest
  ADD CONSTRAINT t_bot_page_manifest_redirect_to_check
  CHECK (redirect_to IS NULL OR entity_type <> 'static');
