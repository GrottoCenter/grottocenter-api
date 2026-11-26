/**
 * CronHeartbeatQueueService.js
 *
 * @description :: Reports the pg_cron jobs of sql/1_cron.sql to their Better
 *   Stack heartbeat monitor (#2029). pg_cron cannot make HTTP calls, so once a
 *   day, after the 04:20-04:50 window, this job reads pg_cron's run history and
 *   pings one monitor for all the cron jobs (the free plan allows ten): a
 *   success when every job's last run succeeded and is recent, `/fail` as soon
 *   as one failed, never ran or is too old (the log names it). Runs still in
 *   progress send nothing. The `exclusive` policy keeps at most one run queued
 *   or running across all API instances.
 *
 *   Unlike the other scheduled jobs it does not report itself: if it stops, the
 *   monitor misses its ping and alerts.
 */

const { ping } = require('../utils/heartbeat');

const QUEUE_NAME = 'cron-heartbeat';
// Every day at 05:30 UTC, 25 minutes after the longest job (~45 min from 04:20)
const CRON = '30 5 * * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  expireInSeconds: 10 * 60,
  retryLimit: 1,
  retryDelay: 10 * 60,
};

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,

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
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('CronHeartbeatQueueService: started and listening for jobs');
  },

  /**
   * Read the run history and report every cron job. Throws when the history
   * cannot be read, so that pg-boss records and retries it; the monitors then
   * alert on the missing pings.
   */
  async processJob() {
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
    if (outcome !== 'skip') {
      await ping(url, { name: 'cron-jobs', failed: outcome === 'fail' });
    }
    return results;
  },
};
