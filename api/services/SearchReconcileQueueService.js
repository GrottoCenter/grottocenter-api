/**
 * SearchReconcileQueueService.js
 *
 * @description :: Schedules the monthly search reconciliation (api/dbSync/
 *   reconcile.js) on the shared pg-boss instance: the safety net behind the
 *   real-time outbox. The `exclusive` policy keeps at most one run queued or
 *   running across all API instances.
 */

const QUEUE_NAME = 'search-reconcile';
// The 1st of each month, 02:00 UTC
const CRON = '0 2 1 * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // A run takes about as long as the former weekly rebuild (~10 minutes).
  // Keep the expiry short: a run killed by a restart blocks the exclusive
  // queue until it expires
  expireInSeconds: 2 * 60 * 60,
  retryLimit: 1,
  retryDelay: 15 * 60,
};

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,

  /**
   * Create the search-reconcile queue, register its schedule and its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'SearchReconcileQueueService: pg-boss not available, skipping'
      );
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC', missed: 'once' });
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info(
      'SearchReconcileQueueService: started and listening for jobs'
    );
  },

  /**
   * Reconcile the search index. Throwing lets pg-boss record the failure and
   * retry once. The job signal is aborted when the job expires: pg-boss does
   * not stop the handler, so the run watches it.
   *
   * @param {Array<{signal: AbortSignal}>} jobs a single job (batchSize 1)
   */
  async processJob([job] = []) {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see DbExportQueueService)
    // eslint-disable-next-line global-require
    const { reconcile } = require('../dbSync/reconcile');
    await reconcile({ signal: job?.signal });
  },
};
