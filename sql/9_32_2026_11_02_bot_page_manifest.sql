\c grottoce;

-- =============================================================================
-- #1758: t_bot_page_manifest, what the page generator has published
-- =============================================================================
--
-- One row per published path (the blob key, for example caves/123.html), written
-- by the generator (api/services/bot/BotPageGeneratorService.js) AFTER each
-- successful upload or delete, so a crash at any point leaves the manifest
-- consistent with what is online (at worst a page is uploaded again).
--
--   path          the blob key, relative to the root of the static site
--   entity_type   'cave', 'massif' or 'organization'; 'static' for the extras
--                 published by the same run (404.html)
--   entity_id     the record id; NULL for a static extra
--   content_hash  sha256 (hex) of the rendered HTML: the change detector. Never
--                 v_bot_page.lastmod, which is only a sitemap hint
--   lastmod       v_bot_page.lastmod of the version published (NULL for extras)
--   published_at  when that version was uploaded
--
-- Production does not run migrations on deploy: apply this file by hand.
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_bot_page_manifest (
  path varchar(255) PRIMARY KEY,
  entity_type varchar(16) NOT NULL,
  entity_id integer,
  content_hash varchar(64) NOT NULL,
  lastmod timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t_bot_page_manifest_entity_type_check
    CHECK (entity_type IN ('cave', 'massif', 'organization', 'static')),
  CONSTRAINT t_bot_page_manifest_entity_id_check
    CHECK ((entity_type = 'static') = (entity_id IS NULL))
);
ALTER TABLE t_bot_page_manifest OWNER TO gc_owner;

-- The generator walks the manifest of one type by entity_id, in ranges
CREATE INDEX IF NOT EXISTS t_bot_page_manifest_type_id_idx
  ON t_bot_page_manifest (entity_type, entity_id);
