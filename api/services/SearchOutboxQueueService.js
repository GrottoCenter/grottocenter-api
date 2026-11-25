/**
 * SearchOutboxQueueService.js
 *
 * @description :: Keeps the search index up to date between full syncs. Every
 *   minute a job drains t_search_outbox, which database triggers fill on each
 *   write search depends on (sql/9_22_2026_10_12_search_outbox.sql). The
 *   `exclusive` policy keeps at most one drain queued or running across all
 *   API instances.
 */

const { withHeartbeat } = require('../utils/heartbeat');

const QUEUE_NAME = 'search-outbox';
const CRON = '* * * * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // Leaves room for the last sync a drain starts (searchOutbox.drain)
  expireInSeconds: 15 * 60,
  // The next run, a minute later, retries what is left in the outbox
  retryLimit: 0,
};

const HEARTBEAT = {
  name: 'search-outbox',
  getUrl: () => sails.config.custom.heartbeats.searchOutbox,
  // Runs every minute: report once per 5 minutes (set the monitor's period to match)
  minIntervalMs: 300000,
};

module.exports = {
  QUEUE_NAME,
  HEARTBEAT,
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
   * in the outbox for the next run. The job signal is aborted when the job
   * expires: pg-boss does not stop the handler, so the drain watches it.
   *
   * Every run logs one line, which the operations workbook charts
   * (grottocenter3-private): a stopped worker shows as a gap.
   *   SearchOutboxQueueService: run changes=4 pending=0 oldestSeconds=0 durationMs=213
   *   SearchOutboxQueueService: run failed pending=12 oldestSeconds=95 durationMs=40 <error>
   * pending and oldestSeconds are -1 when the outbox could not be read.
   *
   * @param {Array<{signal: AbortSignal}>} jobs a single job (batchSize 1)
   */
  async processJob([job] = []) {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see DbExportQueueService)
    // eslint-disable-next-line global-require
    const { drain, backlog } = require('../dbSync/searchOutbox');
    const start = Date.now();
    let changes;
    // A flag rather than the error itself: a rejection may carry no value
    let failed = false;
    let failure;
    try {
      changes = await drain({ signal: job?.signal });
    } catch (err) {
      failed = true;
      failure = err;
    }
    // Measured after the drain: what the next run starts with
    const { pending, oldestSeconds } = await backlog().catch(() => ({
      pending: -1,
      oldestSeconds: -1,
    }));
    const metrics = `pending=${pending} oldestSeconds=${oldestSeconds} durationMs=${
      Date.now() - start
    }`;
    if (failed) {
      sails.log.error(
        `SearchOutboxQueueService: run failed ${metrics}`,
        failure
      );
      throw failure;
    }
    sails.log.info(
      `SearchOutboxQueueService: run changes=${changes} ${metrics}`
    );
  },
};

// Report each run to the job's heartbeat monitor (docs/agents/scheduled-jobs.md).
// Wrapped after the definition so that start() registers the wrapped handler.
module.exports.processJob = withHeartbeat(
  module.exports.processJob,
  module.exports.HEARTBEAT
);
