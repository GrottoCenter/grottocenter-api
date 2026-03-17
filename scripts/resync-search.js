/* eslint-disable no-console */
/**
 * Manual Typesense search index resync script.
 *
 * Lifts the Sails app, runs makeDbSync, then exits.
 * Designed to be run via SSH on the Azure Web App where env vars are already set.
 *
 * Usage:
 *   node scripts/resync-search.js            # Resync Typesense only
 *   node scripts/resync-search.js --export   # Resync + Azure Blob file export
 */

const sailsApp = require('sails');
const { makeDbSync } = require('../api/dbSync/dbSync');

const withExport = process.argv.includes('--export');

const loadConfig = { hooks: { views: false, sockets: false, http: false } };

// Build the datastore config from individual env vars set on Azure App Service.
// Sails' double-underscore env var overrides do not reliably override the
// hardcoded url in config/datastores.js, so we construct it explicitly.
const dbHost = process.env.sails_datastores__default__url;
const dbUser = process.env.sails_datastores__default__user;
const dbPass = process.env.sails_datastores__default__password;
const dbName = process.env.sails_datastores__default__database;

if (dbHost && dbUser && dbPass && dbName) {
  const dbPort = process.env.sails_datastores__default__port || 5432;
  loadConfig.datastores = {
    default: {
      url: `postgres://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${dbPort}/${dbName}`,
      ssl:
        process.env.sails_datastores__default__ssl__rejectUnauthorized ===
        'false'
          ? { rejectUnauthorized: false }
          : true,
    },
  };
} else if (process.env.DATABASE_URL) {
  // Fallback: allow a full connection string via DATABASE_URL.
  loadConfig.datastores = {
    default: { url: process.env.DATABASE_URL, ssl: true },
  };
}

sailsApp.load(loadConfig, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  let exitCode = 0;
  try {
    sails.log.info(
      `[resync] Starting manual resync (file export: ${withExport})`
    );
    await makeDbSync(withExport);
  } catch (e) {
    sails.log.error('[resync] Failed:', e);
    exitCode = 1;
  }

  sailsApp.lower(() => process.exit(exitCode));
});
