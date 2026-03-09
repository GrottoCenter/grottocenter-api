const should = require('should');
const CommonService = require('../../../api/services/CommonService');

// Feature: db-access-patterns-optimization
// Property 8: All required indexes exist after migration
// Property 9: All dead indexes removed after migration

const REQUIRED_INDEXES = [
  // Table indexes
  { table: 't_entrance', name: 'idx_t_entrance_geom_public' },
  { table: 't_entrance', name: 'idx_t_entrance_of_interest' },
  { table: 't_entrance', name: 'idx_t_entrance_country_active' },
  { table: 't_entrance', name: 'idx_t_entrance_iso3166' },
  { table: 't_last_change', name: 'idx_t_last_change_date' },
  { table: 't_last_change', name: 'idx_t_last_change_entity' },
  { table: 't_notification', name: 'idx_t_notification_notified_unread' },
  { table: 't_notification', name: 'idx_t_notification_date' },
  { table: 't_massif', name: 'idx_t_massif_geog' },
  { table: 't_document', name: 'idx_t_document_editor' },
  { table: 't_description', name: 'idx_t_description_massif' },
  { table: 't_grotto', name: 'idx_t_grotto_coords' },
  {
    table: 'j_document_caver_author',
    name: 'idx_j_document_caver_author_caver',
  },
  {
    table: 'j_document_grotto_author',
    name: 'idx_j_document_grotto_author_grotto',
  },
  { table: 'h_name', name: 'idx_h_name_id' },
  { table: 'h_description', name: 'idx_h_description_document' },
  // Materialized view indexes (tables in test DB)
  { table: 'v_data_quality_compute_entrance', name: 'idx_v_dq_country' },
  { table: 'v_data_quality_compute_entrance', name: 'idx_v_dq_entrance' },
  { table: 'v_country_info', name: 'idx_v_country_info_country' },
  { table: 'v_region_info', name: 'idx_v_region_info_region' },
  { table: 'v_bibliographic_metadata', name: 'idx_v_biblio_id' },
  { table: 'v_bibliographic_metadata', name: 'idx_v_biblio_status' },
  { table: 'v_bibliographic_metadata', name: 'idx_v_biblio_oai_id' },
  { table: 'v_bibliographic_metadata', name: 'idx_v_biblio_last_update' },
  { table: 'v_bibliographic_metadata', name: 'idx_v_biblio_sets' },
];

const DEAD_INDEXES = [
  { table: 't_cave', name: 'idx_t_cave_is_deleted' },
  { table: 't_file', name: 'idx_t_file_validated' },
  { table: 't_name', name: 'idx_t_name_point' },
  { table: 't_caver', name: 't_caver_login_key' },
  { table: 't_caver', name: 't_caver_idx' },
  {
    table: 'j_caver_massif_subscription',
    name: 'idx_j_caver_massif_subscription_caver',
  },
  {
    table: 'j_caver_country_subscription',
    name: 'idx_j_caver_country_subscription_caver',
  },
];

/**
 * Property 8: All required indexes exist after migration.
 * Encodes: the migration script creates every index defined in the design.
 * Covers: all 25 required indexes across tables and materialized views.
 */
describe('IndexOptimization - Property 8: required indexes exist', () => {
  REQUIRED_INDEXES.forEach(({ table, name }) => {
    it(`should have index ${name} on ${table}`, async () => {
      const result = await CommonService.query(
        'SELECT indexname, tablename FROM pg_indexes WHERE indexname = $1',
        [name]
      );
      should(result.rows).have.length(
        1,
        `Expected index ${name} to exist on ${table}`
      );
      should(result.rows[0].tablename).equal(table);
    });
  });
});

/**
 * Property 9: All dead indexes removed after migration.
 * Encodes: the migration script drops every dead index identified in diagnostics.
 * Covers: all 7 dead indexes with 0 scans over the diagnostic window.
 */
describe('IndexOptimization - Property 9: dead indexes removed', () => {
  DEAD_INDEXES.forEach(({ table, name }) => {
    it(`should not have dead index ${name} on ${table}`, async () => {
      const result = await CommonService.query(
        'SELECT indexname FROM pg_indexes WHERE indexname = $1',
        [name]
      );
      should(result.rows).have.length(
        0,
        `Expected dead index ${name} to not exist`
      );
    });
  });
});
