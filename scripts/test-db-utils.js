/**
 * Shared database utilities for the test infrastructure.
 *
 * Used by both parallel-test.js and snapshot-test-db.js to avoid
 * duplicating the pg client lifecycle pattern.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');

/**
 * Open a pg.Client against `connectionUrl`, run `fn(client)`, and
 * guarantee the connection is closed even if `fn` throws.
 */
async function withClient(connectionUrl, fn) {
  const client = new Client({ connectionString: connectionUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Terminate every other backend connected to `dbName`.
 */
async function disconnectAll(client, dbName) {
  await client.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbName]
  );
}

module.exports = { withClient, disconnectAll };
