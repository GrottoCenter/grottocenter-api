const UPDATE_SEQUENCES_QUERY = `
-- See this page to know how to get all the sequences updated: https://wiki.postgresql.org/wiki/Fixing_Sequences

-- t_ tables
SELECT SETVAL('public.t_cave_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_cave;
SELECT SETVAL('public.t_caver_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_caver;
SELECT SETVAL('public.t_comment_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_comment;
SELECT SETVAL('public.t_description_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_description;
SELECT SETVAL('public.t_document_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_document;
SELECT SETVAL('public.t_entrance_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_entrance;
SELECT SETVAL('public.t_file_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_file;
SELECT SETVAL('public.t_grotto_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_grotto;
SELECT SETVAL('public.t_group_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_group;
SELECT SETVAL('public.t_history_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_history;
SELECT SETVAL('public.t_location_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_location;
SELECT SETVAL('public.t_massif_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_massif;
SELECT SETVAL('public.t_name_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_name;
SELECT SETVAL('public.t_notification_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_notification;
SELECT SETVAL('public.t_option_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_option;
SELECT SETVAL('public.t_point_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_point;
SELECT SETVAL('public.t_region_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_region;
SELECT SETVAL('public.t_rigging_id_seq', COALESCE(MAX(id), 1) ) FROM public.t_rigging;
`;

const ALTER_MASSIF_COLUMN_GEOG_POLYGON = `
ALTER TABLE public.t_massif ALTER COLUMN geog_polygon TYPE geography USING geog_polygon::geography;
`;

const ALTER_ENTRANCE_COLUMN_POINT_GEOM =
  'ALTER TABLE t_entrance ADD COLUMN point_geom geometry(Point, 4326);';

const POPULATE_ENTRANCE_POINT_GEOM = `
  UPDATE t_entrance
  SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND point_geom IS NULL;
`;

const INDEX_OPTIMIZATION_MIGRATION = `
-- Drop dead indexes
DROP INDEX IF EXISTS idx_t_cave_is_deleted;
DROP INDEX IF EXISTS idx_t_file_validated;
DROP INDEX IF EXISTS idx_t_name_point;
ALTER TABLE t_caver DROP CONSTRAINT IF EXISTS t_caver_login_key;
DROP INDEX IF EXISTS t_caver_idx;
DROP INDEX IF EXISTS idx_j_caver_massif_subscription_caver;
DROP INDEX IF EXISTS idx_j_caver_country_subscription_caver;

-- Table indexes
CREATE INDEX IF NOT EXISTS idx_t_entrance_geom_public
  ON t_entrance USING gist(point_geom)
  WHERE is_sensitive = false AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_entrance_of_interest
  ON t_entrance(id) WHERE is_of_interest = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_entrance_country_active
  ON t_entrance(id_country) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_entrance_iso3166
  ON t_entrance(iso_3166_2) WHERE iso_3166_2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_last_change_date
  ON t_last_change(date_change DESC);
CREATE INDEX IF NOT EXISTS idx_t_last_change_entity
  ON t_last_change(type_entity, id_entity, type_change, date_change);
CREATE INDEX IF NOT EXISTS idx_t_notification_notified_unread
  ON t_notification(id_notified) WHERE date_read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_t_notification_date
  ON t_notification(date_inscription);
CREATE INDEX IF NOT EXISTS idx_t_massif_geog
  ON t_massif USING gist(geog_polygon) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_t_document_editor
  ON t_document(id_editor) WHERE id_editor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_description_massif
  ON t_description(id_massif) WHERE id_massif IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_t_grotto_coords
  ON t_grotto(latitude, longitude) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_j_document_caver_author_caver
  ON j_document_caver_author(id_caver);
CREATE INDEX IF NOT EXISTS idx_j_document_grotto_author_grotto
  ON j_document_grotto_author(id_grotto);
CREATE INDEX IF NOT EXISTS idx_h_name_id ON h_name(id);
CREATE INDEX IF NOT EXISTS idx_h_description_document
  ON h_description(id_document) WHERE id_document IS NOT NULL;

-- Materialized view indexes (tables in test DB)
CREATE INDEX IF NOT EXISTS idx_v_dq_country
  ON v_data_quality_compute_entrance(id_country);
CREATE INDEX IF NOT EXISTS idx_v_dq_entrance
  ON v_data_quality_compute_entrance(id_entrance);
CREATE INDEX IF NOT EXISTS idx_v_country_info_country
  ON v_country_info(id_country);
CREATE INDEX IF NOT EXISTS idx_v_region_info_region
  ON v_region_info(id_region);
CREATE UNIQUE INDEX IF NOT EXISTS idx_v_biblio_id
  ON v_bibliographic_metadata(id_document);
CREATE INDEX IF NOT EXISTS idx_v_biblio_status
  ON v_bibliographic_metadata(metadata_status);
CREATE INDEX IF NOT EXISTS idx_v_biblio_oai_id
  ON v_bibliographic_metadata(oai_identifier);
CREATE INDEX IF NOT EXISTS idx_v_biblio_last_update
  ON v_bibliographic_metadata(last_update);
CREATE INDEX IF NOT EXISTS idx_v_biblio_sets
  ON v_bibliographic_metadata USING gin(list_sets);
`;

module.exports = {
  UPDATE_SEQUENCES_QUERY,
  ALTER_MASSIF_COLUMN_GEOG_POLYGON,
  ALTER_ENTRANCE_COLUMN_POINT_GEOM,
  POPULATE_ENTRANCE_POINT_GEOM,
  INDEX_OPTIMIZATION_MIGRATION,
};
