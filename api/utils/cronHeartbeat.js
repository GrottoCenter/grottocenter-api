/**
 * Heartbeats for the pg_cron jobs of sql/1_cron.sql (docs/agents/scheduled-jobs.md).
 *
 * pg_cron cannot make HTTP calls, so a pg-boss job (CronHeartbeatQueueService)
 * reads pg_cron's run history and reports each job to its own Better Stack
 * monitor. pg_cron lives in the `postgres` database, not in `grottoce`: the
 * history is read over a short-lived connection to it, through a function the
 * API role may call (sql/9_44_2026_11_26_cron_read_for_api.sql).
 */

const { Client } = require('pg');

const CRON_DATABASE = 'postgres';
const QUERY_TIMEOUT_MS = 10000;
const HOUR_MS = 60 * 60 * 1000;
// A run still going this long after it started is stuck, not slow: the longest
// job (the data quality refresh) takes about 45 minutes
const STUCK_AFTER_MS = 3 * HOUR_MS;
const IN_PROGRESS = ['starting', 'connecting', 'sending', 'running'];

/**
 * The jobs to watch: `jobname` is the name given to cron.schedule_in_database
 * in sql/1_cron.sql. They all report to one monitor (the free Better Stack plan
 * allows ten), whose URL is sails.config.custom.heartbeats.cronJobs.
 * `maxAgeMs` is how old the last finished run may be when the
 * check runs (05:30 UTC, after the 04:20-04:50 window):
 *  - daily jobs: 12 h, so that yesterday's run is not mistaken for today's
 *  - every-3-days jobs: 84 h, the longest gap a day-of-month step of 3 gives
 *    (the month end shortens it) plus half a day; a missed run is noticed up
 *    to a day late
 * The monitor has a one-day period: the check reports every day.
 */
const CRON_JOBS = [
  {
    jobname: 'Refresh data quality view daily',
    maxAgeMs: 12 * HOUR_MS,
  },
  {
    jobname: 'Refresh bibliographic metadata view daily',
    maxAgeMs: 12 * HOUR_MS,
  },
  {
    jobname: 'Trim bot outbox daily',
    maxAgeMs: 12 * HOUR_MS,
  },
  {
    jobname: 'Refresh massif info view every 3 days',
    maxAgeMs: 84 * HOUR_MS,
  },
  {
    jobname: 'Refresh country info view every 3 days',
    maxAgeMs: 84 * HOUR_MS,
  },
  {
    jobname: 'Refresh region info view every 3 days',
    maxAgeMs: 84 * HOUR_MS,
  },
];

/**
 * Same server and credentials as `connectionString`, on the pg_cron database.
 * @param {string} connectionString a postgres:// URI
 * @param {string} [database]
 * @returns {string}
 */
const withDatabase = (connectionString, database = CRON_DATABASE) => {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  return url.toString();
};

/**
 * The latest run of every job, whatever its status. A job that was never
 * scheduled is absent, one that never ran has a null status. Matching is on the
 * name, not the id: the id changes when a job is rescheduled.
 *
 * Goes through gc_cron_latest_runs() (sql/9_44_2026_11_26_cron_read_for_api.sql)
 * because pg_cron's tables only show a role the jobs it owns.
 *
 * @param {string} connectionString connection to the pg_cron database
 * @returns {Promise<Array<{jobname: string, status: ?string, start_time: ?Date, end_time: ?Date}>>}
 */
const readLatestRuns = async (connectionString) => {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: QUERY_TIMEOUT_MS,
    statement_timeout: QUERY_TIMEOUT_MS,
    query_timeout: QUERY_TIMEOUT_MS,
  });
  await client.connect();
  try {
    const { rows } = await client.query(
      'SELECT jobname, status, start_time, end_time FROM public.gc_cron_latest_runs()'
    );
    return rows;
  } finally {
    await client.end().catch(() => {});
  }
};

/**
 * What to report for one job.
 *
 * @param {?object} run its latest run (see readLatestRuns), undefined if the
 *   job is not scheduled
 * @param {number} maxAgeMs
 * @param {number} [now]
 * @returns {{outcome: 'ok'|'fail'|'skip', reason: string}} `skip` sends
 *   nothing: the run is in progress, and the monitor's grace covers it
 */
const evaluateRun = (run, maxAgeMs, now = Date.now()) => {
  if (!run) return { outcome: 'fail', reason: 'the job is not scheduled' };
  if (!run.status) return { outcome: 'fail', reason: 'the job never ran' };
  if (IN_PROGRESS.includes(run.status)) {
    const started = run.start_time ? new Date(run.start_time).getTime() : now;
    return now - started > STUCK_AFTER_MS
      ? { outcome: 'fail', reason: `the run has been ${run.status} for hours` }
      : { outcome: 'skip', reason: 'a run is in progress' };
  }
  if (run.status !== 'succeeded') {
    return { outcome: 'fail', reason: `the last run ${run.status}` };
  }
  const ended = run.end_time ? new Date(run.end_time).getTime() : NaN;
  if (!(now - ended <= maxAgeMs)) {
    return { outcome: 'fail', reason: 'the last successful run is too old' };
  }
  return { outcome: 'ok', reason: 'the last run succeeded' };
};

/**
 * @param {Array} runs the result of readLatestRuns
 * @param {number} [now]
 * @returns {Array<{jobname: string, outcome: string, reason: string}>}
 */
const evaluateJobs = (runs, now = Date.now()) =>
  CRON_JOBS.map(({ jobname, maxAgeMs }) => ({
    jobname,
    ...evaluateRun(
      runs.find((r) => r.jobname === jobname),
      maxAgeMs,
      now
    ),
  }));

/**
 * What to report to the one monitor: `fail` as soon as one job needs it, `ok`
 * when all of them are fine, `skip` (nothing is sent, the grace covers it) when
 * the others are fine but a run is still in progress.
 *
 * @param {Array<{outcome: string}>} results the result of evaluateJobs
 * @returns {'ok'|'fail'|'skip'}
 */
const summarize = (results) => {
  if (results.some((r) => r.outcome === 'fail')) return 'fail';
  if (results.some((r) => r.outcome === 'skip')) return 'skip';
  return 'ok';
};

module.exports = {
  CRON_JOBS,
  CRON_DATABASE,
  withDatabase,
  readLatestRuns,
  evaluateRun,
  evaluateJobs,
  summarize,
};
