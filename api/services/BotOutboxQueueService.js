/**
 * BotOutboxQueueService.js
 *
 * @description :: Removes or re-renders the bot pages a change affects, within
 *   minutes (#1886). Every minute a job runs BotOutboxService over
 *   t_bot_outbox, which the database triggers fill on each write a page
 *   depends on (sql/9_37_2026_11_06_bot_outbox.sql). The `exclusive` policy
 *   keeps at most one run queued or running across all API instances.
 *
 *   Off unless `sails.config.custom.botSurface.enabled` (BOT_SURFACE_ENABLED=true).
 *   The pages are written to the storage adapter of
 *   `sails.config.custom.botSurface.storage`.
 */

const QUEUE_NAME = 'bot-outbox';
const CRON = '* * * * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // A run stops starting batches after BotOutboxService.TIME_BUDGET_MS (45 s);
  // this leaves room for the batch under way
  expireInSeconds: 10 * 60,
  // The next run, a minute later, retries what is left in the outbox
  retryLimit: 0,
};

module.exports = {
  QUEUE_NAME,
  CRON,
  QUEUE_OPTIONS,

  /**
   * Create the bot-outbox queue, register its schedule and its worker. Called
   * from bootstrap.js after pg-boss is started. Does nothing unless the bot
   * surface is enabled; fails (the caller logs it) when the storage is
   * misconfigured, rather than failing every minute.
   */
  async start() {
    const { botSurface } = sails.config.custom;
    if (!botSurface || !botSurface.enabled) {
      sails.log.info(
        'BotOutboxQueueService: bot surface not enabled (BOT_SURFACE_ENABLED), skipping'
      );
      return;
    }
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn('BotOutboxQueueService: pg-boss not available, skipping');
      return;
    }
    // eslint-disable-next-line global-require
    require('./bot/storage').createStorageAdapter(botSurface.storage);
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC' });
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('BotOutboxQueueService: started and listening for jobs');
  },

  /**
   * One run. Throwing lets pg-boss record the failure; the rows stay in the
   * outbox for the next run. Every run logs one line:
   *   BotOutboxQueueService: run rows=3 pages=5 rendered=5 uploaded=1 redirected=0 deleted=2 unchanged=2 pending=0 oldestSeconds=0 durationMs=213
   *   BotOutboxQueueService: run skipped, a generation or sitemap run holds the lock pending=12 oldestSeconds=95 durationMs=4
   *   BotOutboxQueueService: run failed pending=12 oldestSeconds=95 durationMs=40 <error>
   * pending and oldestSeconds are -1 when the outbox could not be read.
   *
   * @param {Array<{signal: AbortSignal}>} jobs a single job (batchSize 1)
   */
  async processJob([job] = []) {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see SearchOutboxQueueService)
    /* eslint-disable global-require */
    const BotOutboxService = require('./bot/BotOutboxService');
    const { createStorageAdapter } = require('./bot/storage');
    /* eslint-enable global-require */
    const start = Date.now();
    let result;
    let failed = false;
    let failure;
    try {
      result = await BotOutboxService.run({
        adapter: createStorageAdapter(sails.config.custom.botSurface.storage),
        signal: job?.signal,
      });
    } catch (err) {
      failed = true;
      failure = err;
    }
    // Measured after the run: what the next run starts with
    const { pending, oldestSeconds } = await BotOutboxService.backlog().catch(
      () => ({ pending: -1, oldestSeconds: -1 })
    );
    const metrics = `pending=${pending} oldestSeconds=${oldestSeconds} durationMs=${
      Date.now() - start
    }`;
    if (failed) {
      sails.log.error(`BotOutboxQueueService: run failed ${metrics}`, failure);
      throw failure;
    }
    if (result.skipped) {
      sails.log.info(
        `BotOutboxQueueService: run skipped, a generation or sitemap run holds the lock ${metrics}`
      );
      return;
    }
    const { rows, pages, rendered, uploaded, redirected, deleted, unchanged } =
      result;
    sails.log.info(
      `BotOutboxQueueService: run rows=${rows} pages=${pages} rendered=${rendered} uploaded=${uploaded} redirected=${redirected} deleted=${deleted} unchanged=${unchanged} ${metrics}`
    );
  },
};
