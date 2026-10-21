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

const QUERY_CANCELED = '57014';
const MAX_CAUSE_DEPTH = 5;

// Whether `arg` is, or was caused by, a cancelled query. Waterline nests the
// driver's error under `cause` and `raw.error`.
const isQueryCanceled = (arg, depth = 0) => {
  if (!arg || typeof arg !== 'object' || depth > MAX_CAUSE_DEPTH) return false;
  if (arg.code === QUERY_CANCELED) return true;
  return [arg.cause, arg.raw, arg.error].some((next) =>
    isQueryCanceled(next, depth + 1)
  );
};

// Whether `data`, on its way to a 500, is the cancellation of the current
// request's queries after its client went away (#1849), rather than an
// unrelated failure: a cancelled query error, or no error at all (the message
// of a controller that caught the error, and logged it, itself).
const isCancelledOnAbort = (data) =>
  Boolean(asyncLocalStorage.getStore()?.cancelledOnAbort) &&
  (!(data instanceof Error) || isQueryCanceled(data));

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
      // Once a request's queries were cancelled because its client went away
      // (#1849), the errors the cancellation raises are expected: keep them,
      // as warnings. Any other error stays one: a pooled socket keeps the
      // context it was opened in, and may log a genuine failure in it long
      // after that request is gone.
      if (
        level === 'error' &&
        asyncLocalStorage.getStore()?.cancelledOnAbort &&
        args.some((arg) => isQueryCanceled(arg))
      ) {
        originalMethods.warn(
          `[${getTraceId()}]`,
          '(after client abort)',
          ...args.map(redactLogArgs)
        );
        return;
      }
      originalMethods[level](`[${getTraceId()}]`, ...args.map(redactLogArgs));
    };
  });
};

module.exports = {
  getTraceId,
  getStore: () => asyncLocalStorage.getStore(),
  run: (traceId, callback) => asyncLocalStorage.run({ traceId }, callback),
  isCancelledOnAbort,
  patchSailsLog,
};
