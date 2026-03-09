\c grottoce;
-- =============================================================================
-- Migration: Database Access Patterns Optimization
-- Date: 2026-03-09
-- Description: Drop 7 dead indexes, create 16 table indexes, 9 mat view indexes
-- Idempotent: All statements use IF EXISTS / IF NOT EXISTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Drop dead indexes (reclaims ~2.6 MB + reduces write overhead)
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_t_cave_is_deleted;
DROP INDEX IF EXISTS idx_t_file_validated;
DROP INDEX IF EXISTS idx_t_name_point;
ALTER TABLE t_caver DROP CONSTRAINT IF EXISTS t_caver_login_key;
DROP INDEX IF EXISTS t_caver_idx;
DROP INDEX IF EXISTS idx_j_caver_massif_subscription_caver;
DROP INDEX IF EXISTS idx_j_caver_country_subscription_caver;

-- -----------------------------------------------------------------------------
-- 2. Create table indexes
-- -----------------------------------------------------------------------------

-- AP-1/2: Geoloc entrance spatial — #1 bottleneck (543s total, 13K+ calls)
CREATE INDEX IF NOT EXISTS idx_t_entrance_geom_public
  ON t_entrance USING gist(point_geom)
  WHERE is_sensitive = false AND is_deleted = false;

-- AP-18: Random entrance of interest (59ms mean, full scan + random sort)
CREATE INDEX IF NOT EXISTS idx_t_entrance_of_interest
  ON t_entrance(id)
  WHERE is_of_interest = true AND is_deleted = false;

-- AP-17: Active entrances by country (98ms mean full scan)
CREATE INDEX IF NOT EXISTS idx_t_entrance_country_active
  ON t_entrance(id_country)
  WHERE is_deleted = false;

-- AP-23 supplementary: Entrance ISO region
CREATE INDEX IF NOT EXISTS idx_t_entrance_iso3166
  ON t_entrance(iso_3166_2)
  WHERE iso_3166_2 IS NOT NULL;

-- AP-14: t_last_change — zero indexes, 197ms mean SELECT, 6.3ms mean UPDATE
CREATE INDEX IF NOT EXISTS idx_t_last_change_date
  ON t_last_change(date_change DESC);

CREATE INDEX IF NOT EXISTS idx_t_last_change_entity
  ON t_last_change(type_entity, id_entity, type_change, date_change);

-- AP-13: t_notification — 5.8B seq reads, 0% index hit
CREATE INDEX IF NOT EXISTS idx_t_notification_notified_unread
  ON t_notification(id_notified)
  WHERE date_read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_t_notification_date
  ON t_notification(date_inscription);

-- AP-4/5: Massif polygon spatial lookups (12,894 calls)
CREATE INDEX IF NOT EXISTS idx_t_massif_geog
  ON t_massif USING gist(geog_polygon)
  WHERE is_deleted = false;

-- AP-19: Documents by editor
CREATE INDEX IF NOT EXISTS idx_t_document_editor
  ON t_document(id_editor)
  WHERE id_editor IS NOT NULL;

-- AP-27: Description by massif
CREATE INDEX IF NOT EXISTS idx_t_description_massif
  ON t_description(id_massif)
  WHERE id_massif IS NOT NULL;

-- AP-3: Grotto map markers
CREATE INDEX IF NOT EXISTS idx_t_grotto_coords
  ON t_grotto(latitude, longitude)
  WHERE is_deleted = false;

-- AP-7/24: Document author junction — reverse lookup for caver profiles
CREATE INDEX IF NOT EXISTS idx_j_document_caver_author_caver
  ON j_document_caver_author(id_caver);

CREATE INDEX IF NOT EXISTS idx_j_document_grotto_author_grotto
  ON j_document_grotto_author(id_grotto);

-- AP-11: h_name — 25M seq reads, composite PK has 0 scans
CREATE INDEX IF NOT EXISTS idx_h_name_id
  ON h_name(id);

-- AP-11: h_description by document
CREATE INDEX IF NOT EXISTS idx_h_description_document
  ON h_description(id_document)
  WHERE id_document IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Create materialized view indexes
-- -----------------------------------------------------------------------------

-- AP-23: v_data_quality_compute_entrance — 92s per refresh, 212M seq reads
CREATE INDEX IF NOT EXISTS idx_v_dq_country
  ON v_data_quality_compute_entrance(id_country);

CREATE INDEX IF NOT EXISTS idx_v_dq_entrance
  ON v_data_quality_compute_entrance(id_entrance);

-- AP-33: v_country_info — 913M seq reads, 0% idx hit
-- (keep existing unique index for REFRESH CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_v_country_info_country
  ON v_country_info(id_country);

-- AP-34: v_region_info — 401M seq reads, 0% idx hit
-- (keep existing unique index for REFRESH CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_v_region_info_region
  ON v_region_info(id_region);

-- AP-21: v_bibliographic_metadata — 220MB, zero indexes, 57.3% cache hit
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
