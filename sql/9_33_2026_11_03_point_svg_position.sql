\c grottoce;

-- =============================================================================
-- #1733: position points on an SVG cave map
-- =============================================================================
--
-- Relation A, the reference SVG a point is drawn on:
--   t_point.id_reference_document  the plan (a t_document) the point is shown on
--   t_point.x, t_point.y           its position in that SVG's own viewBox units
-- The three are set together or not at all: a point without a position stays
-- valid.
--
-- Relation B, the documents that reference a point (photos, reports...):
--   t_document.id_point            the point a document documents (one-to-many)
--
-- h_document does not historize id_point: like the j_document_* links, it is a
-- documentary link, not part of the document's content.
--
-- Production does not run migrations on deploy: apply this file by hand, BEFORE
-- deploying the API (Waterline selects every model column).
-- Idempotent.
-- =============================================================================

ALTER TABLE t_point ADD COLUMN IF NOT EXISTS id_reference_document integer NULL;
ALTER TABLE t_point ADD COLUMN IF NOT EXISTS x double precision NULL;
ALTER TABLE t_point ADD COLUMN IF NOT EXISTS y double precision NULL;

ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_reference_document_fk;
ALTER TABLE t_point
  ADD CONSTRAINT t_point_reference_document_fk
  FOREIGN KEY (id_reference_document) REFERENCES t_document(id);

ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_position_check;
ALTER TABLE t_point
  ADD CONSTRAINT t_point_position_check CHECK (
    (id_reference_document IS NULL AND x IS NULL AND y IS NULL)
    OR (id_reference_document IS NOT NULL AND x IS NOT NULL AND y IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_t_point_reference_document
  ON t_point (id_reference_document)
  WHERE id_reference_document IS NOT NULL;

ALTER TABLE t_document ADD COLUMN IF NOT EXISTS id_point integer NULL;

ALTER TABLE t_document DROP CONSTRAINT IF EXISTS t_document_t_point_fk;
ALTER TABLE t_document
  ADD CONSTRAINT t_document_t_point_fk
  FOREIGN KEY (id_point) REFERENCES t_point(id);

CREATE INDEX IF NOT EXISTS idx_t_document_point
  ON t_document (id_point)
  WHERE id_point IS NOT NULL;
