/**
 * DbExportQueueService.js
 *
 * @description :: Schedules the weekly DB file export on the shared pg-boss
 *   instance. The export runs on its own queue, decoupled from the search
 *   index sync, and the `exclusive` policy keeps at most one export queued or
 *   running across all API instances.
 */

const QUEUE_NAME = 'db-export';
// Sunday 03:00 UTC, away from the Monday 02:00 search sync
const CRON = '0 3 * * 0';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // A full export takes minutes; leave a wide margin before pg-boss expires it
  expireInSeconds: 3 * 60 * 60,
  retryLimit: 1,
  retryDelay: 15 * 60,
};

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,

  /**
   * Create the db-export queue, register its weekly schedule and its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn('DbExportQueueService: pg-boss not available, skipping');
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC', missed: 'once' });
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('DbExportQueueService: started and listening for jobs');
  },

  /**
   * Run the export. Throwing lets pg-boss record the failure and retry.
   */
  async processJob() {
    // Required here rather than at load time: Sails loads this service while it
    // re-requires api/, and a top-level require would pin stale copies of the
    // services dbExport depends on.
    // eslint-disable-next-line global-require
    const { makeDbExport } = require('../dbSync/dbExport');
    await makeDbExport();
  },
};
