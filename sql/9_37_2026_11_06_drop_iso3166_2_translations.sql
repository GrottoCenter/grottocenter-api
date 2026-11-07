\c grottoce;

-- =============================================================================
-- #1937: drop the translated name_<lang> columns of t_iso3166_2
-- =============================================================================
--
-- Only t_iso3166_2.name is read. The 15 name_<lang> columns came from a scraped
-- import, were partly empty (name_ar and name_pt in every row) and often wrong;
-- their only reader was the managedRegions of the organization endpoints.
--
-- Production does not run migrations on deploy: apply this file by hand AFTER
-- deploying the API (the previous API selects these columns explicitly).
-- Idempotent.
-- =============================================================================

ALTER TABLE t_iso3166_2
  DROP COLUMN IF EXISTS name_ar,
  DROP COLUMN IF EXISTS name_bg,
  DROP COLUMN IF EXISTS name_ca,
  DROP COLUMN IF EXISTS name_de,
  DROP COLUMN IF EXISTS name_el,
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS name_es,
  DROP COLUMN IF EXISTS name_fr,
  DROP COLUMN IF EXISTS name_he,
  DROP COLUMN IF EXISTS name_id,
  DROP COLUMN IF EXISTS name_it,
  DROP COLUMN IF EXISTS name_ja,
  DROP COLUMN IF EXISTS name_nl,
  DROP COLUMN IF EXISTS name_pt,
  DROP COLUMN IF EXISTS name_ro;
