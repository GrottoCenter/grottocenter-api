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
const logger = require('../api/utils/logger');

// eslint-disable-next-line func-names
module.exports.bootstrap = async function (done) {
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
      sails.log.warn(
        `Primary key validation issue in model '${model}' - type mismatch between database and model definition`
      );
      return;
    }
    originalWarn.apply(console, args);
  };

  dbSync.registerMakeDbSync();
  await dbSync.ensureSearchDbIsPopulated();

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
