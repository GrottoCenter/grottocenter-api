const sails = require('sails');
const Fixted = require('fixted');
const sailsPostGreAdapter = require('sails-postgresql');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');
const customSQL = require('./customSQL');
const CommonService = require('../api/services/CommonService');
const FIXTURE_ORDER = require('./fixtureOrder');
const { DEFAULT_TEST_URL } = require('./test-config');

const testUrl = process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL;

// Condense verbose Waterline primary key warnings into one-liners.
// This override is process-global and permanent for the test run. If a future
// test needs to assert on these specific warnings, it should stub console.warn
// locally with sinon rather than relying on the raw output.
/* eslint-disable no-console */
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (
    message.includes('missing or invalid `id`') &&
    message.includes('Records sent back from a database adapter')
  ) {
    const modelMatch = message.match(/for model `([^`]+)`/);
    const model = modelMatch ? modelMatch[1] : 'unknown';
    console.warn(
      `Primary key validation issue in model '${model}' - type mismatch between database and model definition`
    );
    return;
  }
  originalWarn.apply(console, args);
};

// ─── Database detection ──────────────────────────────────────────────────────

const parsedUrl = new URL(testUrl);
const testDbName = parsedUrl.pathname.slice(1);
const templateDbName = `${testDbName}_template`;
parsedUrl.pathname = '/postgres';
const maintenanceUrl = parsedUrl.toString();

/**
 * Check if the test database already has fixture data (e.g., cloned from
 * a template by the parallel runner). If so, we can skip the full bootstrap.
 */
async function dbHasFixtureData() {
  const client = new Client({ connectionString: testUrl });
  await client.connect();
  try {
    const result = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 't_caver' LIMIT 1"
    );
    if (result.rows.length === 0) return false;
    const count = await client.query('SELECT COUNT(*) AS n FROM t_caver');
    return parseInt(count.rows[0].n, 10) > 0;
  } catch (err) {
    console.warn('[bootstrap] Could not check fixture data:', err.message);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Check if a template database exists for cloning.
 */
async function templateExists() {
  const client = new Client({ connectionString: maintenanceUrl });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [templateDbName]
    );
    return result.rows.length > 0;
  } finally {
    await client.end();
  }
}

async function restoreFromTemplate() {
  const client = new Client({ connectionString: maintenanceUrl });
  await client.connect();
  try {
    await client.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [testDbName]
    );
    await client.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
    await client.query(
      `CREATE DATABASE "${testDbName}" TEMPLATE "${templateDbName}"`
    );
  } finally {
    await client.end();
  }
}

// ─── Sails lift ──────────────────────────────────────────────────────────────

function configureServer() {
  // Expose the already-listening HTTP server as sails.hooks.http.app so that
  // supertest(sails.hooks.http.app) reuses it instead of calling listen(0)
  // on a new ephemeral server for every request. This eliminates socket hang
  // ups caused by rapid listen/close cycles under parallel load.
  //
  // supertest checks `typeof app === 'function'` — an http.Server instance
  // is an object, so supertest skips createServer() and calls address()
  // directly, finding the port Sails is already listening on.
  sails.hooks.http.app = sails.hooks.http.server;
}

/**
 * Fast path: database already has data (cloned by parallel runner or template).
 * Just lift Sails with migrate:safe — no schema changes, no fixtures.
 */
function liftSafe(label) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    sails.lift(
      {
        log: { level: 'error' },
        datastores: {
          default: { adapter: sailsPostGreAdapter, url: testUrl },
        },
        models: { migrate: 'safe' },
        csrf: false,
        bootstrap: () => {},
      },
      (err) => {
        if (err) return reject(err);
        configureServer();
        console.log(`[bootstrap] ${label} — ready in ${Date.now() - start}ms`);
        return resolve();
      }
    );
  });
}

/**
 * Full path: drop all tables, load fixtures, run migrations.
 */
function liftFull() {
  return new Promise((resolve, reject) => {
    console.log(
      '[bootstrap] Full bootstrap (migrate:drop + fixtures). ' +
        'Run `npm run test:snapshot` for faster runs.'
    );

    sails.lift(
      {
        log: { level: 'error' },
        datastores: {
          default: { adapter: sailsPostGreAdapter, url: testUrl },
        },
        models: { migrate: 'drop' },
        csrf: false,
        async bootstrap() {
          // Replace the normal bootstrap.js
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
        configureServer();

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
                customSQL.INDEX_OPTIMIZATION_MIGRATION,
                customSQL.QUERY_PERFORMANCE_FIXES_MIGRATION,
              ].join('\n')
            )
              .then(() => resolve())
              .catch(reject);
          },
          false
        );
      }
    );
  });
}

// ─── Bootstrap strategy ──────────────────────────────────────────────────────

async function bootstrap() {
  // 1. If the parallel runner cloned a fresh DB, just lift (no restore needed).
  if (process.env.TEST_DB_CLONED === '1' && (await dbHasFixtureData())) {
    return liftSafe('Pre-cloned database detected');
  }

  // 2. If a template exists, clone it (fresh data) and lift.
  if (await templateExists()) {
    const start = Date.now();
    console.log('[bootstrap] Restoring from template...');
    await restoreFromTemplate();
    console.log(`[bootstrap] Template restored in ${Date.now() - start}ms`);
    return liftSafe('Restored from template');
  }

  // 3. Full bootstrap.
  return liftFull();
}

// ─── Mocha hooks ─────────────────────────────────────────────────────────────

// this.timeout() is not accessible with an arrow function
/* eslint-disable func-names */
before(function (done) {
  this.timeout(30000);
  bootstrap().then(() => done(), done);
});

after((done) => {
  sails.lower((err) => {
    if (err) console.error('Error lowering sails:', err);
    setTimeout(() => process.exit(0), 100);
    done(err);
  });
});
