\c grottoce;

-- =============================================================================
-- #1668: keep PERMANENT_DELETE notifications readable
-- =============================================================================
--
-- A notification only referenced its entity through a foreign key. Once the
-- entity is permanently deleted, nothing is left to tell the user what was
-- deleted. The snapshot keeps the entity's identity in the row itself:
--
--   { "type": "comment", "id": 5, "name": "…", "parent": { "type": "entrance", "id": 2 } }
--
-- It is written on every notification created from now on; rows created
-- before this migration keep NULL (they are purged after two months anyway).
-- =============================================================================

ALTER TABLE t_notification ADD COLUMN IF NOT EXISTS entity_snapshot jsonb NULL;
