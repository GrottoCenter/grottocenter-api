\c grottoce;

-- =============================================================================
-- #1733, #1961: points positioned on SVG cave maps
-- =============================================================================
--
-- Positions, the SVG documents a point is drawn on:
--   j_point_document_position (id_point, id_document, x, y)
-- One row per (point, document): a point can appear on a plan and on a section
-- at the same time. x and y are in the SVG's own viewBox units. Every SVG file
-- used for positioning within a document shares one fixed reference frame, so
-- the positions belong to the document, not to one of its files.
--
-- Attached documents, the documents that reference a point (photos,
-- reports...):
--   t_document.id_point            the point a document documents (one-to-many)
-- h_document does not historize id_point: like the j_document_* links, it is a
-- documentary link, not part of the document's content.
--
-- Location of a point:
--   t_point.is_underground         true underground, false at the surface,
--                                  NULL not classified yet
-- Existing points are left unclassified (NULL): their status is not inferred
-- from their cave or their coordinates. A user classifies them through
-- PATCH /api/v1/points/:id; a new point must be given an explicit value.
--
-- An earlier version of this migration stored a single position on t_point
-- (id_reference_document, x, y). If it was applied, its positions are moved to
-- the junction and the columns are dropped.
--
-- Production does not run migrations on deploy: apply this file by hand, BEFORE
-- deploying the API (Waterline selects every model column).
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS j_point_document_position (
  id serial PRIMARY KEY,
  id_point integer NOT NULL,
  id_document integer NOT NULL,
  x double precision NOT NULL,
  y double precision NOT NULL,
  date_inscription timestamp NOT NULL DEFAULT now(),
  date_reviewed timestamp NULL
);
-- Also transfers its id sequence, owned by the serial column.
ALTER TABLE j_point_document_position OWNER TO gc_owner;

ALTER TABLE j_point_document_position
  DROP CONSTRAINT IF EXISTS j_point_document_position_point_fk;
ALTER TABLE j_point_document_position
  ADD CONSTRAINT j_point_document_position_point_fk
  FOREIGN KEY (id_point) REFERENCES t_point(id);

ALTER TABLE j_point_document_position
  DROP CONSTRAINT IF EXISTS j_point_document_position_document_fk;
ALTER TABLE j_point_document_position
  ADD CONSTRAINT j_point_document_position_document_fk
  FOREIGN KEY (id_document) REFERENCES t_document(id);

-- PostgreSQL accepts NaN and infinities in double precision columns.
ALTER TABLE j_point_document_position
  DROP CONSTRAINT IF EXISTS j_point_document_position_finite_check;
ALTER TABLE j_point_document_position
  ADD CONSTRAINT j_point_document_position_finite_check CHECK (
    x NOT IN ('NaN', 'Infinity', '-Infinity')
    AND y NOT IN ('NaN', 'Infinity', '-Infinity')
  );

-- One position per point and document; also the conflict target of the
-- idempotent PUT /api/v1/points/:id/positions/:documentId.
CREATE UNIQUE INDEX IF NOT EXISTS uq_j_point_document_position_point_document
  ON j_point_document_position (id_point, id_document);
CREATE INDEX IF NOT EXISTS idx_j_point_document_position_document
  ON j_point_document_position (id_document);

-- Move the positions of the earlier single-position columns, if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 't_point'
      AND column_name = 'id_reference_document'
  ) THEN
    INSERT INTO j_point_document_position (id_point, id_document, x, y)
    SELECT id, id_reference_document, x, y
    FROM t_point
    WHERE id_reference_document IS NOT NULL
    ON CONFLICT (id_point, id_document) DO NOTHING;
  END IF;
END
$$;

ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_position_check;
ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_reference_document_fk;
DROP INDEX IF EXISTS idx_t_point_reference_document;
ALTER TABLE t_point DROP COLUMN IF EXISTS id_reference_document;
ALTER TABLE t_point DROP COLUMN IF EXISTS x;
ALTER TABLE t_point DROP COLUMN IF EXISTS y;

ALTER TABLE t_point ADD COLUMN IF NOT EXISTS is_underground boolean NULL;

ALTER TABLE t_document ADD COLUMN IF NOT EXISTS id_point integer NULL;

ALTER TABLE t_document DROP CONSTRAINT IF EXISTS t_document_t_point_fk;
ALTER TABLE t_document
  ADD CONSTRAINT t_document_t_point_fk
  FOREIGN KEY (id_point) REFERENCES t_point(id);

CREATE INDEX IF NOT EXISTS idx_t_document_point
  ON t_document (id_point)
  WHERE id_point IS NOT NULL;
