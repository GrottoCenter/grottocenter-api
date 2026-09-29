const { AsyncLocalStorage } = require('async_hooks');
const redactLogArgs = require('./redactLogArgs');

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

  // Redacting here rather than at the call sites is deliberate: this is the only
  // place that sees the raw arguments of every sails.log.* call, so it covers
  // api/helpers/log-response.js, the responseTimeLogger in config/http.js, the
  // queue services and every other error-logging site at once. config/log.js
  // holds a string-level backstop for the log methods not patched here.
  Object.keys(originalMethods).forEach((level) => {
    sails.log[level] = (...args) => {
      originalMethods[level](`[${getTraceId()}]`, ...args.map(redactLogArgs));
    };
  });
};

module.exports = {
  getTraceId,
  run: (traceId, callback) => asyncLocalStorage.run({ traceId }, callback),
  patchSailsLog,
};
