/**
 * SearchOutboxQueueService.js
 *
 * @description :: Keeps the search index up to date between full syncs. Every
 *   minute a job drains t_search_outbox, which database triggers fill on each
 *   write search depends on (sql/9_22_2026_10_12_search_outbox.sql). The
 *   `exclusive` policy keeps at most one drain queued or running across all
 *   API instances.
 */

const QUEUE_NAME = 'search-outbox';
const CRON = '* * * * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // A drain stops after 10 minutes (searchOutbox.drain), under the expiry
  expireInSeconds: 15 * 60,
  // The next run, a minute later, retries what is left in the outbox
  retryLimit: 0,
};

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,

  /**
   * Create the search-outbox queue, register its schedule and its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'SearchOutboxQueueService: pg-boss not available, skipping'
      );
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC' });
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('SearchOutboxQueueService: started and listening for jobs');
  },

  /**
   * Drain the outbox. Throwing lets pg-boss record the failure; the rows stay
   * in the outbox for the next run.
   */
  async processJob() {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see DbExportQueueService)
    // eslint-disable-next-line global-require
    const { drain } = require('../dbSync/searchOutbox');
    const processed = await drain();
    if (processed > 0) {
      sails.log.info(`SearchOutboxQueueService: ${processed} changes indexed`);
    }
  },
};
