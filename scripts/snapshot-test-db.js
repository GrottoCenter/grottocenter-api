/**
 * Test Database Snapshot Manager
 *
 * Speeds up test bootstrap by using PostgreSQL template databases.
 * Instead of dropping all tables, loading fixtures, and running migrations
 * on every test run (~2 min), this script snapshots a fully seeded database
 * as a template. Subsequent runs clone the template in ~300ms.
 *
 * Usage:
 *   node scripts/snapshot-test-db.js --seed    # Full bootstrap + snapshot
 *   node scripts/snapshot-test-db.js --check   # Check if template exists
 *   node scripts/snapshot-test-db.js --clean   # Drop the template
 *
 * Environment:
 *   POSTGRE_TEST_URL — postgres URL (default: postgres://root:root@localhost:5432/grottoce)
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { withClient, disconnectAll } = require('./test-db-utils');

const { DEFAULT_TEST_URL } = require('../test/test-config');

const testUrl = process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL;

const url = new URL(testUrl);
const testDbName = url.pathname.slice(1);
const templateDbName = `${testDbName}_template`;
url.pathname = '/postgres';
const maintenanceUrl = url.toString();

function runFullBootstrap() {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line global-require
    const sails = require('sails');
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const Fixted = require('fixted');
    // eslint-disable-next-line global-require
    const sailsPostGreAdapter = require('sails-postgresql');
    // eslint-disable-next-line global-require
    const customSQL = require('../test/customSQL');
    // eslint-disable-next-line global-require
    const CommonService = require('../api/services/CommonService');
    // eslint-disable-next-line global-require
    const FIXTURE_ORDER = require('../test/fixtureOrder');

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
            if (fixtedError) {
              sails.lower(() => reject(fixtedError));
              return;
            }

            CommonService.query(
              [
                customSQL.UPDATE_SEQUENCES_QUERY,
                customSQL.POPULATE_ENTRANCE_POINT_GEOM,
                customSQL.INDEX_OPTIMIZATION_MIGRATION,
                customSQL.QUERY_PERFORMANCE_FIXES_MIGRATION,
              ].join('\n')
            )
              .then(() => {
                sails.lower((lowerErr) => {
                  if (lowerErr) reject(lowerErr);
                  else resolve();
                });
              })
              .catch((sqlErr) => {
                sails.lower(() => reject(sqlErr));
              });
          },
          false
        );
      }
    );
  });
}

async function seed() {
  console.log(`[snapshot] Seeding template "${templateDbName}"...`);

  await withClient(maintenanceUrl, async (client) => {
    await disconnectAll(client, templateDbName);
    await client.query(
      `UPDATE pg_database SET datistemplate = false WHERE datname = $1`,
      [templateDbName]
    );
    await client.query(`DROP DATABASE IF EXISTS "${templateDbName}"`);
  });

  console.log('[snapshot] Running full bootstrap (migrate:drop + fixtures)...');
  await runFullBootstrap();
  console.log('[snapshot] Bootstrap complete. Creating template...');

  await withClient(maintenanceUrl, async (client) => {
    await disconnectAll(client, testDbName);
    await client.query(
      `CREATE DATABASE "${templateDbName}" TEMPLATE "${testDbName}"`
    );
    await client.query(
      `UPDATE pg_database SET datistemplate = true WHERE datname = $1`,
      [templateDbName]
    );
  });

  console.log(`[snapshot] Template "${templateDbName}" created.`);

  // Write a stamp file so the parallel runner can detect staleness
  const stampPath = path.join(__dirname, '..', 'test', '.snapshot-stamp');
  fs.writeFileSync(stampPath, new Date().toISOString());
}

async function check() {
  const exists = await withClient(maintenanceUrl, async (client) => {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [templateDbName]
    );
    return result.rows.length > 0;
  });

  console.log(
    exists
      ? `[snapshot] Template "${templateDbName}" exists.`
      : `[snapshot] Template "${templateDbName}" does not exist.`
  );
  process.exit(exists ? 0 : 1);
}

async function clean() {
  console.log(`[snapshot] Dropping template "${templateDbName}"...`);
  await withClient(maintenanceUrl, async (client) => {
    await disconnectAll(client, templateDbName);
    await client.query(
      `UPDATE pg_database SET datistemplate = false WHERE datname = $1`,
      [templateDbName]
    );
    await client.query(`DROP DATABASE IF EXISTS "${templateDbName}"`);
  });
  const stampPath = path.join(__dirname, '..', 'test', '.snapshot-stamp');
  if (fs.existsSync(stampPath)) fs.unlinkSync(stampPath);
  console.log('[snapshot] Done.');
}

const commands = { '--seed': seed, '--check': check, '--clean': clean };
const command = commands[process.argv[2]];

if (!command) {
  console.log(
    'Usage: node scripts/snapshot-test-db.js [--seed|--check|--clean]'
  );
  process.exit(1);
}

command().catch((err) => {
  console.error('[snapshot] Error:', err.message);
  process.exit(1);
});
