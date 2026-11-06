/**
 * Shared database seeding logic.
 *
 * Lifts Sails with migrate:drop, loads fixtures, and runs post-fixture SQL
 * migrations. Used by both the test bootstrap (bootstrap.test.js) and the
 * snapshot script (scripts/snapshot-test-db.js) to avoid duplicating the
 * bootstrap sequence.
 *
 * @param {object} options
 * @param {string} options.testUrl - PostgreSQL connection URL for the test DB
 * @returns {Promise<object>} Resolves with the lifted `sails` instance
 */

const sails = require('sails');
const Fixted = require('fixted');
// eslint-disable-next-line import/no-extraneous-dependencies
const sailsPostGreAdapter = require('sails-postgresql');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');
const customSQL = require('./customSQL');
const CommonService = require('../api/services/CommonService');
const FIXTURE_ORDER = require('./fixtureOrder');

/**
 * Drop objects that are not managed by Waterline but depend on Waterline-managed
 * tables (FK references, views). Without this, migrate:drop fails because it
 * cannot drop the referenced tables. The views are created again after the
 * fixtures, by the migrations in customSQL.
 */
async function dropNonWaterlineTables(testUrl) {
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query('DROP VIEW IF EXISTS v_bot_hub');
    await client.query('DROP VIEW IF EXISTS v_bot_redirect');
    await client.query('DROP VIEW IF EXISTS v_bot_page');
    // Not a model: it outlives migrate:drop, so a changed definition would
    // never reach a persistent test database
    await client.query('DROP TABLE IF EXISTS t_bot_page_manifest');
    await client.query('DROP TABLE IF EXISTS t_bot_outbox');
    await client.query('DROP TABLE IF EXISTS t_bot_pipeline_run');
    await client.query('DROP TABLE IF EXISTS t_bibliographic_metadata');
    await client.query('DROP TYPE IF EXISTS e_metadata_status');
  } finally {
    await client.end();
  }
}

async function seedDatabase({ testUrl }) {
  await dropNonWaterlineTables(testUrl);
  return new Promise((resolve, reject) => {
    sails.lift(
      {
        log: { level: 'error' },
        datastores: {
          default: { adapter: sailsPostGreAdapter, url: testUrl },
        },
        models: { migrate: 'drop' },
        csrf: false,
        async bootstrap() {
          await CommonService.query(customSQL.ALTER_MASSIF_COLUMN_GEOG_POLYGON);
          await CommonService.query(customSQL.ALTER_ENTRANCE_COLUMN_POINT_GEOM);
          await CommonService.query(
            customSQL.CREATE_ENTRANCE_POINT_GEOM_INSERT_TRIGGER
          );
        },
      },
      // eslint-disable-next-line consistent-return
      async (liftErr) => {
        if (liftErr) return reject(liftErr);

        const fixted = new Fixted();
        fixted.populate(
          FIXTURE_ORDER,
          // eslint-disable-next-line consistent-return
          (fixtedError) => {
            if (fixtedError) return reject(fixtedError);

            CommonService.query(
              [
                customSQL.UPDATE_SEQUENCES_QUERY,
                customSQL.POPULATE_ENTRANCE_POINT_GEOM,
                customSQL.CONVERT_MEASUREMENT_TO_PARTITIONED,
                customSQL.CREATE_MEASUREMENT_PARTITION_FUNCTION,
                customSQL.INDEX_OPTIMIZATION_MIGRATION,
                customSQL.QUERY_PERFORMANCE_FIXES_MIGRATION,
                customSQL.CREATE_BIBLIOGRAPHIC_METADATA_TABLE,
                customSQL.DROP_HISTORY_PARENT_FK_CONSTRAINTS,
                customSQL.ADMIN_MFA_MIGRATION,
                customSQL.CREATE_GUIDELINE_TRIGGERS,
                customSQL.CREATE_COMMENT_TRIGGERS,
                customSQL.CREATE_SUB_ENTITY_TRIGGERS,
                customSQL.CREATE_DOCUMENT_CHANGE_TRIGGER,
                customSQL.CREATE_DOCUMENT_HISTO_FUNCTION,
                customSQL.CREATE_ENTRANCE_HISTO_FUNCTION,
                customSQL.CREATE_GROTTO_SOFT_DELETE_TRIGGER,
                customSQL.SEARCH_OUTBOX_MIGRATION,
                customSQL.SEARCH_OUTBOX_FILE_MIGRATION,
                customSQL.ORGANIZATION_TYPE_MIGRATION,
                customSQL.ORGANIZATION_TYPE_OTHER_MIGRATION,
                customSQL.BOT_CASCADE_CHECK_MIGRATION,
                customSQL.BOT_FOUNDATION_MIGRATION,
                customSQL.BOT_ADMIT_PAGES_MIGRATION,
                customSQL.BOT_PAGE_VIEW_MIGRATION,
                customSQL.BOT_PAGE_VIEW_MASSIFS_ORGANIZATIONS_MIGRATION,
                customSQL.BOT_PAGE_MANIFEST_MIGRATION,
                customSQL.BOT_PAGE_MANIFEST_REDIRECT_MIGRATION,
                customSQL.BOT_HUB_MIGRATION,
                customSQL.BOT_OUTBOX_MIGRATION,
                customSQL.BOT_PIPELINE_RUN_MIGRATION,
                customSQL.POINT_GEOM_MIGRATION,
              ].join('\n')
            )
              // Planner statistics, as production has them. A fresh database
              // has none: the planner then takes every table for a big one,
              // and the large bot views cross jit_above_cost, so each read pays
              // seconds of JIT compilation for a few rows (production runs with
              // jit off). A database cloned from the template keeps them.
              .then(() => CommonService.query('ANALYZE'))
              .then(() => resolve(sails))
              .catch(reject);
          },
          false
        );
      }
    );
  });
}

module.exports = seedDatabase;
