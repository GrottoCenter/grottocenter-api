\c grottoce;

-- =============================================================================
-- Retire the translated name columns of t_country (#1939)
--
-- native_name is the only country name the API and the front end read; the
-- front end localizes country names from the ISO code with Intl.DisplayNames.
-- The only reader of the translated columns left in the database is
-- v_data_quality_compute_entrance, which exposed fr_name as country_name: it
-- now exposes native_name. Postgres refuses to drop fr_name while the view
-- depends on it, so the view is dropped and recreated first.
--
-- Everything runs in one transaction: search_outbox_enqueue_data_quality reads
-- the view by name and would fail while it is missing.
--
-- Idempotent: the view is recreated from scratch and the columns are dropped
-- with IF EXISTS.
-- =============================================================================

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS v_data_quality_compute_entrance;
CREATE MATERIALIZED VIEW v_data_quality_compute_entrance AS
  SELECT e.id as id_entrance,
  GREATEST(e.date_inscription, e.date_reviewed) as general_latest_date_of_update,
  (COUNT(DISTINCT e.date_inscription)+ COUNT(DISTINCT e.date_reviewed)) as general_nb_contributions,

  GREATEST(MAX(l.date_inscription), MAX(l.date_reviewed)) as location_latest_date_of_update,
  (COUNT(DISTINCT l.date_inscription)+ COUNT(DISTINCT l.date_reviewed)) as location_nb_contributions,

  GREATEST(MAX(d.date_inscription), MAX(d.date_reviewed)) as description_latest_date_of_update,
  (COUNT(DISTINCT d.date_inscription)+ COUNT(DISTINCT d.date_reviewed)) as description_nb_contributions,

  GREATEST(MAX(doc.date_inscription), MAX(doc.date_reviewed)) as document_latest_date_of_update,
  (COUNT(DISTINCT doc.date_inscription)+ COUNT(DISTINCT doc.date_reviewed)) as document_nb_contributions,

  GREATEST(MAX(r.date_inscription), MAX(r.date_reviewed)) as rigging_latest_date_of_update,
  (COUNT(DISTINCT r.date_inscription)+ COUNT(DISTINCT r.date_reviewed)) as rigging_nb_contributions,

  GREATEST(MAX(h.date_inscription), MAX(h.date_reviewed)) as history_latest_date_of_update,
  (COUNT(DISTINCT h.date_inscription)+ COUNT(DISTINCT h.date_reviewed)) as history_nb_contributions,

  GREATEST(MAX(c.date_inscription), MAX(c.date_reviewed)) as comment_latest_date_of_update,
  (COUNT(DISTINCT c.date_inscription)+ COUNT(DISTINCT c.date_reviewed)) as comment_nb_contributions,

  m.id as id_massif,
  n.name as entrance_name,
  nn.name as massif_name,
  e.id_country as id_country,
  co.native_name as country_name,
  NOW() as date_of_update

  FROM t_entrance e
  LEFT JOIN t_country co ON co.iso = e.id_country
  LEFT JOIN t_location l ON e.id = l.id_entrance
  LEFT JOIN t_description d ON e.id = d.id_entrance
  LEFT JOIN j_document_entrance jde ON e.id = jde.id_entrance
  LEFT JOIN t_document doc ON jde.id_document = doc.id
  LEFT JOIN t_rigging r ON e.id = r.id_entrance
  LEFT JOIN t_history h ON e.id = h.id_entrance
  LEFT JOIN t_comment c ON e.id = c.id_entrance
  LEFT JOIN t_name n ON e.id = n.id_entrance
  LEFT JOIN t_massif m ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  LEFT JOIN (SELECT * FROM t_name WHERE is_main = true) nn ON m.id = nn.id_massif
  WHERE n.is_main = true
  AND e.is_deleted = false
  GROUP BY e.id, m.id, n.name, nn.name, co.native_name
  WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS v_data_quality_compute_entrance_id_massif_id_entrance_idx
  ON v_data_quality_compute_entrance (id_massif, id_entrance);
CREATE INDEX IF NOT EXISTS idx_vdqce_entrance_massif
  ON v_data_quality_compute_entrance (id_entrance, id_massif);
CREATE INDEX IF NOT EXISTS idx_v_dq_country
  ON v_data_quality_compute_entrance (id_country);
CREATE INDEX IF NOT EXISTS idx_v_dq_entrance
  ON v_data_quality_compute_entrance (id_entrance);

REFRESH MATERIALIZED VIEW v_data_quality_compute_entrance;

-- A refresh runs with the privileges of the view's owner. In production
-- gc_owner owns the tables the view reads, so it owns the view again. On a
-- fresh volume the tables are not transferred yet: 99_refresh_views.sql would
-- fail on a view owned by gc_owner, and zz_ownership_and_grants.sql transfers
-- the view with every other object.
DO $$
BEGIN
  IF (SELECT relowner FROM pg_class WHERE oid = 't_entrance'::regclass)
     = (SELECT oid FROM pg_roles WHERE rolname = 'gc_owner') THEN
    ALTER MATERIALIZED VIEW v_data_quality_compute_entrance OWNER TO gc_owner;
  END IF;
END
$$;

-- Dropping the view dropped its grants, and the default privileges only cover
-- objects created by gc_owner or grottoce: restore what the view had.
GRANT SELECT, INSERT, UPDATE, DELETE ON v_data_quality_compute_entrance TO gc_app;
GRANT SELECT ON v_data_quality_compute_entrance TO gc_readonly;

ALTER TABLE t_country
  DROP COLUMN IF EXISTS en_name,
  DROP COLUMN IF EXISTS fr_name,
  DROP COLUMN IF EXISTS es_name,
  DROP COLUMN IF EXISTS de_name,
  DROP COLUMN IF EXISTS bg_name,
  DROP COLUMN IF EXISTS it_name,
  DROP COLUMN IF EXISTS ca_name,
  DROP COLUMN IF EXISTS nl_name,
  DROP COLUMN IF EXISTS rs_name;

COMMIT;
