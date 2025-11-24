const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

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
