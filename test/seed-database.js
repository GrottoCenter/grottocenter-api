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
 * Drop tables that are not managed by Waterline but have FK references to
 * Waterline-managed tables. Without this, migrate:drop fails because it
 * cannot drop the referenced tables.
 */
async function dropNonWaterlineTables(testUrl) {
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
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
                customSQL.INDEX_OPTIMIZATION_MIGRATION,
                customSQL.QUERY_PERFORMANCE_FIXES_MIGRATION,
                customSQL.CREATE_BIBLIOGRAPHIC_METADATA_TABLE,
                customSQL.DROP_HISTORY_PARENT_FK_CONSTRAINTS,
                customSQL.ADMIN_MFA_MIGRATION,
                customSQL.CREATE_GUIDELINE_TRIGGERS,
                customSQL.CREATE_COMMENT_TRIGGERS,
                customSQL.CREATE_SUB_ENTITY_TRIGGERS,
              ].join('\n')
            )
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
