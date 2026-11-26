/**
 * CronHeartbeatQueueService.js
 *
 * @description :: Reports the pg_cron jobs of sql/1_cron.sql to their Better
 *   Stack heartbeat monitor (#2029). pg_cron cannot make HTTP calls, so once a
 *   day, after the 04:20-04:50 window, this job reads pg_cron's run history and
 *   pings one monitor for all the cron jobs (the free plan allows ten): a
 *   success when every job's last run succeeded and is recent, `/fail` as soon
 *   as one failed, never ran or is too old (the log names it). While a run is
 *   still in progress it checks again every 10 minutes until about 07:20, then
 *   reports `/fail`, inside the monitor's grace. The `exclusive` policy keeps
 *   at most one run queued or running across all API instances.
 *
 *   Unlike the other scheduled jobs it does not report itself: if it stops, the
 *   monitor misses its ping and alerts.
 */

const { ping } = require('../utils/heartbeat');

const QUEUE_NAME = 'cron-heartbeat';
// Every day at 05:30 UTC, 25 minutes after the longest job (~45 min from 04:20)
const CRON = '30 5 * * *';
// A run still in progress at 05:30 is checked again every 10 minutes, the last
// attempt (the 12th, 11 retries) at about 07:20: inside the monitor's 2 hour
// grace after the 05:30 ping. A ping that never comes because a healthy run is
// slow would be a false alert, and one that comes after the grace is as late as
// none. The same retries cover a database that cannot be read for a while.
const RETRY_DELAY_SECONDS = 10 * 60;
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  expireInSeconds: 10 * 60,
  retryLimit: 11,
  retryDelay: RETRY_DELAY_SECONDS,
};

// The handler needs each job's own retryLimit and retryCount to tell the last
// attempt from the others
const WORK_OPTIONS = { includeMetadata: true };

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,
  WORK_OPTIONS,

  /**
   * Create the queue, register its schedule and its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn('CronHeartbeatQueueService: pg-boss not available');
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC' });
    await boss.work(QUEUE_NAME, WORK_OPTIONS, module.exports.processJob);
    sails.log.info('CronHeartbeatQueueService: started and listening for jobs');
  },

  /**
   * Read the run history and report the cron jobs to the one monitor.
   *
   * Throws, so that pg-boss records the attempt and retries it later, when the
   * history cannot be read (the monitor then alerts on the missing ping) and
   * while a run is still in progress and nothing is wrong so far. The last
   * attempt reports `/fail` instead of throwing for a run that is still going.
   *
   * @param {Array<{retryCount: number, retryLimit: number}>} jobs a single job
   *   (batchSize 1); called without one outside pg-boss
   */
  async processJob([job] = []) {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see DbExportQueueService)
    // eslint-disable-next-line global-require
    const cron = require('../utils/cronHeartbeat');
    const url = sails.config.custom.heartbeats.cronJobs;
    // Dev and tests set no URL: do not open a connection for nothing
    if (!url) return [];

    const connectionString = cron.withDatabase(
      sails.services.enrichmentqueueservice.getConnectionString()
    );
    const runs = await cron.readLatestRuns(connectionString);
    const results = cron.evaluateJobs(runs);
    results
      .filter((r) => r.outcome !== 'ok')
      .forEach(({ jobname, outcome, reason }) => {
        sails.log.warn(`cron-heartbeat: "${jobname}" (${outcome}): ${reason}`);
      });

    const outcome = cron.summarize(results);
    if (outcome === 'skip') {
      const lastAttempt =
        Number.isInteger(job?.retryLimit) && job.retryCount >= job.retryLimit;
      if (!lastAttempt) {
        throw new Error('A cron job is still running, checking again later');
      }
      sails.log.warn('cron-heartbeat: a run is still going after the retries');
      await ping(url, { name: 'cron-jobs', failed: true });
      return results;
    }
    await ping(url, { name: 'cron-jobs', failed: outcome === 'fail' });
    return results;
  },
};
