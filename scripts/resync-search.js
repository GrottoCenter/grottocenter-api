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

sailsApp.load(
  { hooks: { views: false, sockets: false, http: false } },
  async (err) => {
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
  }
);
