/**
 * Heartbeat reporting for scheduled jobs (docs/agents/scheduled-jobs.md).
 *
 * A heartbeat monitor (Better Stack) expects a ping at a fixed cadence and
 * alerts when one is missed: GET <url> reports a run that succeeded and GET
 * <url>/fail one that failed. That catches what an uptime check cannot see, a
 * job that silently stopped running.
 *
 * Reporting never affects the job: a missing or invalid URL, a timeout or an
 * unreachable monitor is logged and swallowed. The URL carries a secret token,
 * so it is never logged.
 */

const TIMEOUT_MS = 5000;
// An https URL made of plain characters: no credentials, quotes or spaces
const URL_PATTERN = /^https:\/\/[A-Za-z0-9._~:/?&=%+-]+$/;

// Last successful ping per URL, to throttle the jobs that run every minute
const lastSuccess = new Map();

const defaultLog = (level, message) => {
  const logger = global.sails && global.sails.log;
  if (logger && typeof logger[level] === 'function') logger[level](message);
};

/**
 * Send one ping. Never throws.
 *
 * @param {?string} url the heartbeat URL; unset means the job is not monitored
 * @param {object} [options]
 * @param {string} [options.name] job name, for the log
 * @param {boolean} [options.failed] report a failed run (`<url>/fail`)
 * @param {Function} [options.fetchImpl] defaults to the global fetch
 * @param {Function} [options.log] (level, message), defaults to sails.log
 * @returns {Promise<boolean>} whether the monitor acknowledged the ping
 */
const ping = async (
  url,
  {
    name = 'job',
    failed = false,
    fetchImpl = global.fetch,
    log = defaultLog,
  } = {}
) => {
  if (!url) return false;
  if (!URL_PATTERN.test(url)) {
    log(
      'warn',
      `heartbeat(${name}): ignored, the URL is not a plain https URL`
    );
    return false;
  }
  try {
    const target = failed ? `${url.replace(/\/+$/, '')}/fail` : url;
    const response = await fetchImpl(target, {
      method: 'GET',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      log(
        'warn',
        `heartbeat(${name}): the monitor answered ${response.status}`
      );
      return false;
    }
    return true;
  } catch (err) {
    log('warn', `heartbeat(${name}): ping failed (${err.name})`);
    return false;
  }
};

/**
 * Wrap a job handler so that each run reports to its heartbeat monitor: a ping
 * when it returns, `/fail` when it throws (the error is rethrown unchanged).
 *
 * @param {Function} handler the job handler
 * @param {object} options
 * @param {string} options.name job name, for the log
 * @param {Function} options.getUrl returns the heartbeat URL at run time
 * @param {number} [options.minIntervalMs] throttle for jobs that run every
 *   minute: a success is reported at most once per interval. Failures always
 *   are. Set the monitor's period to this interval.
 * @param {Function} [options.fetchImpl] test seam
 * @param {Function} [options.log] test seam
 * @param {Function} [options.now] test seam
 * @returns {Function} an async function with the handler's signature
 *
 * While pg-boss will retry the job, a failure is not reported: the retry's
 * success clears the monitor, and only the last attempt failing is worth an
 * alert. The decision uses the job's own `retryLimit`, the value pg-boss
 * applies (copied from the queue when the job is created), which the handler
 * only receives when the worker is registered with
 * `{ includeMetadata: true }`. Without it every failure is reported. A
 * failure also clears the throttle, so that the next success resolves the
 * incident at once.
 */
const withHeartbeat = (
  handler,
  { name, getUrl, minIntervalMs = 0, fetchImpl, log, now = Date.now }
) => {
  const wrapped = async (...args) => {
    let result;
    try {
      result = await handler(...args);
    } catch (err) {
      const [job] = Array.isArray(args[0]) ? args[0] : [];
      const willRetry =
        Number.isInteger(job?.retryLimit) &&
        job.retryLimit > 0 &&
        job.retryCount < job.retryLimit;
      if (!willRetry) {
        const url = getUrl();
        lastSuccess.delete(url);
        await ping(url, { name, failed: true, fetchImpl, log });
      }
      throw err;
    }
    const url = getUrl();
    if (!url) return result;
    const last = lastSuccess.get(url);
    if (last === undefined || now() - last >= minIntervalMs) {
      if (await ping(url, { name, fetchImpl, log }))
        lastSuccess.set(url, now());
    }
    return result;
  };
  // Lets a test check which monitor a handler reports to
  wrapped.heartbeat = { name, getUrl, minIntervalMs };
  return wrapped;
};

const resetThrottle = () => lastSuccess.clear();

module.exports = { ping, withHeartbeat, resetThrottle, TIMEOUT_MS };
