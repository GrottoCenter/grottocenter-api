/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

const dbSync = require('../api/dbSync/dbSync');
const sesSuppressionPoller = require('../api/sesSuppressionPoller/sesSuppressionPoller');
const logger = require('../api/utils/logger');
const TurnstileService = require('../api/services/TurnstileService');

// eslint-disable-next-line func-names
module.exports.bootstrap = async function (done) {
  // Validate Turnstile configuration first — fail fast before any I/O if misconfigured
  TurnstileService.validateConfig();

  if (!TurnstileService.isEnabled()) {
    sails.log.warn(
      '[AntiBot:Turnstile] Turnstile verification is disabled — signup endpoint will skip CAPTCHA validation'
    );
  }

  logger.patchSailsLog();

  // Condense primary key validation warnings for all models to save on log output
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
      // Suppress validation warnings for legacy history models where Waterline expects
      // a string/number primary key, but the database returned a Date object due to the legacy composite PK.
      // NOTE: any new H-prefixed history model must be added to this list to keep its
      // startup logs clean.
      const legacyHistoryModels = [
        'hcave',
        'hcomment',
        'hdescription',
        'hdocument',
        'hentrance',
        'hgrotto',
        'hguideline',
        'hhistory',
        'hlocation',
        'hmassif',
        'hname',
        'hrigging',
      ];
      if (legacyHistoryModels.includes(model)) {
        return;
      }
      sails.log.warn(
        `Primary key validation issue in model '${model}' - type mismatch between database and model definition`
      );
      return;
    }
    originalWarn.apply(console, args);
  };

  dbSync.registerMakeDbSync();
  sesSuppressionPoller.registerPoller();
  await dbSync.ensureSearchDbIsPopulated();

  // Blocking: load token blacklist cache before accepting requests
  await sails.services.blacklistservice.loadCache();

  // Blocking: load country resolver cache before accepting requests
  await sails.services.countryresolverservice.loadCache();

  // Blocking: start enrichment queue before accepting requests
  try {
    await sails.services.enrichmentqueueservice.start();
  } catch (err) {
    sails.enrichmentBoss = null;
    sails.log.error('Failed to start EnrichmentQueueService:', err.message);
    sails.log.warn(
      'Enrichment processing will be unavailable — entrance creation still works'
    );
  }

  // Register graceful shutdown for the shared pg-boss instance.
  // Both EnrichmentQueueService and CSVImportQueueService use the same
  // sails.enrichmentBoss instance, so stopping it shuts down all workers.
  sails.config.beforeShutdown = async (cb) => {
    try {
      await sails.services.enrichmentqueueservice.stop();
    } catch (err) {
      sails.log.error('Error stopping EnrichmentQueueService:', err.message);
    }
    cb();
  };

  // Blocking: start CSV import queue before accepting requests
  try {
    await sails.services.csvimportqueueservice.start();
  } catch (err) {
    sails.log.error('Failed to start CSVImportQueueService:', err.message);
    sails.log.warn('CSV import processing will be unavailable');
  }

  // Fire-and-forget: load coordinates snapshot without blocking server startup
  // Must use sails.services to get the same instance Sails loaded (include-all
  // clears the require cache, so a direct require() returns a stale instance).
  sails.services.coordinatessnapshotservice.load().catch((err) => {
    sails.log.error('Failed to load coordinates snapshot on bootstrap:', err);
  });

  sails.services.massifcoordinatessnapshotservice.load().catch((err) => {
    sails.log.error(
      'Failed to load massif coordinates snapshot on bootstrap:',
      err
    );
  });

  return done();
};
// By convention, this is a good place to set up fake data during development.
//
// For example:
// ```
// // Set up fake development data (or if we already have some, avast)
// if (await User.count() > 0) {
//   return done();
// }
//
// await User.createEach([
//   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
//   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
//   // etc.
// ]);
// ```
// Don't forget to trigger `done()` when this bootstrap function's logic is finished.
// (otherwise your server will never lift, since it's waiting on the bootstrap)
