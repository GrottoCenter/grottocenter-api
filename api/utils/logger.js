const { AsyncLocalStorage } = require('async_hooks');

// Use a singleton stored on global to survive Sails' require-cache clearing.
// Without this, different require() calls get different AsyncLocalStorage
// instances, causing trace IDs to be lost in background workers.
if (!global.grottoAsyncLocalStorage) {
  global.grottoAsyncLocalStorage = new AsyncLocalStorage();
}
const asyncLocalStorage = global.grottoAsyncLocalStorage;

const getTraceId = () => asyncLocalStorage.getStore()?.traceId || 'no-trace';

const patchSailsLog = () => {
  const originalMethods = {
    info: sails.log.info,
    error: sails.log.error,
    warn: sails.log.warn,
    debug: sails.log.debug,
    verbose: sails.log.verbose,
  };

  Object.keys(originalMethods).forEach((level) => {
    sails.log[level] = (...args) => {
      originalMethods[level](`[${getTraceId()}]`, ...args);
    };
  });
};

module.exports = {
  getTraceId,
  run: (traceId, callback) => asyncLocalStorage.run({ traceId }, callback),
  patchSailsLog,
};
