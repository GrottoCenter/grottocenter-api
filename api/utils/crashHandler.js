/**
 * crashHandler.js
 *
 * App-wide policy for errors that escape every other handler:
 * - uncaughtException: the process state is unknown, so log one fatal line,
 *   lower Sails (which runs `beforeShutdown` and drains in-flight requests),
 *   then exit(1) and let App Service restart the container. A hard cap makes
 *   sure a stuck shutdown cannot keep a broken process alive.
 * - unhandledRejection: log it and keep running. A stray rejected promise is
 *   confined to the code that dropped it, which does not justify an outage.
 *
 * Installed from app.js before `sails.lift`, so crashes during lift are
 * covered as well; until Sails has a logger, console.error is used.
 */

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10 * 1000;

const install = ({
  proc = process,
  getSails = () => global.sails,
  exit = (code) => process.exit(code),
  timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
} = {}) => {
  const logError = (...args) => {
    const sails = getSails();
    if (sails && sails.log && typeof sails.log.error === 'function') {
      sails.log.error(...args);
    } else {
      console.error(new Date().toISOString(), ...args); // eslint-disable-line no-console
    }
  };

  let shuttingDown = false;
  const shutdownOnce = (code) => {
    if (shuttingDown) return;
    shuttingDown = true;

    const timer = setTimeout(() => {
      logError(`[crash] Shutdown did not finish in ${timeoutMs}ms, exiting`);
      exit(code);
    }, timeoutMs);
    if (timer.unref) timer.unref();

    const sails = getSails();
    if (!sails || !sails.isLifted || typeof sails.lower !== 'function') {
      clearTimeout(timer);
      exit(code);
      return;
    }

    try {
      sails.lower((err) => {
        if (err) logError('[crash] Error while lowering Sails', err);
        clearTimeout(timer);
        exit(code);
      });
    } catch (err) {
      logError('[crash] Error while lowering Sails', err);
      clearTimeout(timer);
      exit(code);
    }
  };

  proc.on('uncaughtException', (err, origin) => {
    logError('[crash] uncaughtException, shutting down', {
      origin,
      code: err && err.code,
      stack: err && err.stack ? err.stack : String(err),
    });
    shutdownOnce(1);
  });

  proc.on('unhandledRejection', (reason) => {
    logError('[crash] unhandledRejection', {
      code: reason && reason.code,
      stack: reason && reason.stack ? reason.stack : String(reason),
    });
  });
};

module.exports = { install, DEFAULT_SHUTDOWN_TIMEOUT_MS };
