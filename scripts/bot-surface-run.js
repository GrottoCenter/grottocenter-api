/* eslint-disable no-console */
/**
 * Manual trigger of the nightly bot-surface pipeline (#1760).
 *
 * Puts one `bot-surface-nightly` job in the pg-boss queue; a running API
 * instance started with the same configuration picks it up and runs the
 * pipeline (the worker registers as soon as BOT_SURFACE_ENTITY_TYPES lists a
 * type and the storage is valid, with or without BOT_SURFACE_ENABLED). The
 * queue is `exclusive`: when a run is already queued or running, nothing is
 * added. There is no HTTP endpoint. The script does not run the pipeline
 * itself and does not wait for it.
 *
 * Designed to be run via SSH on the Azure Web App where the environment
 * variables are already set.
 *
 * Usage:
 *   npm run bot-surface:run
 *
 * Follow the run with:
 *   SELECT id, status, failed_step, started_at, finished_at, step_durations, error
 *     FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1;
 *
 * Exit code: 0 enqueued, 1 refused (not configured, or a run is already queued
 * or running) or failed.
 */

const sailsApp = require('sails');
const { PgBoss } = require('pg-boss');

// Same datastore handling as scripts/resync-search.js: the Azure variables
const loadConfig = {
  hooks: { views: false, sockets: false, http: false },
  // Nothing of the application's startup is needed, and it would start every
  // queue worker in this process
  bootstrap: (done) => done(),
  log: { level: 'warn' },
};

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
  let boss;
  try {
    const queueService = sails.services.botpipelinequeueservice;
    // Refuse before connecting to pg-boss when nothing is configured
    queueService.checkConfigured();
    boss = new PgBoss({
      connectionString:
        sails.services.enrichmentqueueservice.getConnectionString(),
      // As in EnrichmentQueueService: the application role cannot create schemas
      createSchema: false,
      supervise: false,
      schedule: false,
    });
    boss.on('error', (e) => console.error('pg-boss error:', e.message || e));
    await boss.start();
    const { enqueued, jobId } = await queueService.enqueue(boss);
    if (enqueued) {
      console.log(
        `Enqueued bot-surface-nightly (job ${jobId}). An API instance started with this configuration will run it; follow it in t_bot_pipeline_run.`
      );
    } else {
      console.error(
        'Nothing enqueued: a bot-surface-nightly run is already queued or running.'
      );
      exitCode = 1;
    }
  } catch (e) {
    console.error(
      e.code === 'E_BOT_NOT_CONFIGURED'
        ? `Refused. ${e.message}`
        : `Failed: ${e.message}`
    );
    exitCode = 1;
  }

  try {
    if (boss) await boss.stop({ graceful: true, timeout: 10000 });
  } catch (e) {
    console.error('Could not stop pg-boss:', e.message);
  }
  sailsApp.lower(() => process.exit(exitCode));
});
