/**
 * DbExportQueueService.js
 *
 * @description :: Schedules the weekly DB file export on the shared pg-boss
 *   instance. The export runs on its own queue, decoupled from the search
 *   index sync, and the `exclusive` policy keeps at most one export queued or
 *   running across all API instances.
 */

const { withHeartbeat } = require('../utils/heartbeat');

const QUEUE_NAME = 'db-export';
// Sunday 03:00 UTC, away from the monthly search reconciliation (1st, 02:00)
const CRON = '0 3 * * 0';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // A full export takes minutes. Keep the expiry short: an export killed by a
  // restart stays active until it expires, and blocks the exclusive queue
  expireInSeconds: 60 * 60,
  retryLimit: 1,
  retryDelay: 15 * 60,
};

// The handler needs each job's own retryLimit and retryCount to tell a failed
// attempt that pg-boss retries from the last one (see withHeartbeat)
const WORK_OPTIONS = { includeMetadata: true };

const HEARTBEAT = {
  name: 'db-export',
  getUrl: () => sails.config.custom.heartbeats.dbExport,
};

module.exports = {
  QUEUE_NAME,
  HEARTBEAT,
  WORK_OPTIONS,
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
    await boss.work(QUEUE_NAME, WORK_OPTIONS, module.exports.processJob);
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

// Report each run to the job's heartbeat monitor (docs/agents/scheduled-jobs.md).
// Wrapped after the definition so that start() registers the wrapped handler.
module.exports.processJob = withHeartbeat(
  module.exports.processJob,
  module.exports.HEARTBEAT
);
