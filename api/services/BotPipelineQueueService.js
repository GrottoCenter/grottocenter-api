/**
 * BotPipelineQueueService.js
 *
 * @description :: Schedules the nightly bot-surface pipeline (#1760) as the
 *   pg-boss job `bot-surface-nightly`, next to the other Node-side schedules
 *   (SearchOutboxQueueService, DbExportQueueService). The steps and the run
 *   record are in api/services/bot/BotPipelineService.js.
 *
 *   Two switches, so that production can be driven by hand before the
 *   schedule goes on (docs/bot-surface.md):
 *
 *   - The WORKER registers when the surface is configured: at least one type in
 *     BOT_SURFACE_ENTITY_TYPES and a valid storage. It only acts on a job in the
 *     queue, which `npm run bot-surface:run` puts there (enqueue()).
 *   - The SCHEDULE registers only when BOT_SURFACE_ENABLED=true as well (the
 *     switch of the withdrawal worker). Otherwise a schedule left in pg-boss by
 *     an earlier configuration is removed, so switching the flag off stops the
 *     nightly run.
 *
 *   Nothing registers when no type is listed (and a leftover schedule is removed). The `exclusive` policy keeps at
 *   most one run queued or running across all API instances: an enqueue while
 *   one is queued or running is refused by pg-boss (send() returns null).
 */

const QUEUE_NAME = 'bot-surface-nightly';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  // Above any plausible run. The first full publication (about 11,000 cave pages
  // plus hubs, redirects and sitemaps) has not been measured; a typical night
  // changes few pages. A job killed by a restart stays active until it expires
  // and blocks the exclusive queue, a manual run included, so the value is not
  // padded further: 4 hours, well under the 24 hours between two nights. If
  // the measured first run gets close to it, raise it (docs/bot-surface.md).
  expireInSeconds: 4 * 60 * 60,
  // A failed run is not retried at once: it stopped for a reason (see the run
  // record), and the next night starts again
  retryLimit: 0,
};

/**
 * Whether the pipeline can run: a type is listed and the storage is valid.
 * Throws when the storage is misconfigured (the local driver in production).
 *
 * @returns {{configured: boolean, reason: ?string}}
 */
const checkConfigured = () => {
  const botSurface = sails.config.custom.botSurface || {};
  if (!botSurface.entityTypes || botSurface.entityTypes.length === 0) {
    return {
      configured: false,
      reason: 'BOT_SURFACE_ENTITY_TYPES lists no entity type',
    };
  }
  // Required here rather than at load time: see BotOutboxQueueService
  // eslint-disable-next-line global-require
  require('./bot/storage').createStorageAdapter(botSurface.storage);
  return { configured: true, reason: null };
};

module.exports = {
  QUEUE_NAME,
  QUEUE_OPTIONS,
  checkConfigured,

  /**
   * Create the queue and register the worker, and the schedule when enabled.
   * Called from bootstrap.js after pg-boss is started. Fails (the caller logs
   * it) when the storage is misconfigured, rather than failing every night.
   */
  async start() {
    const { botSurface } = sails.config.custom;
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'BotPipelineQueueService: pg-boss not available, skipping'
      );
      return;
    }
    const { configured, reason } = checkConfigured();
    if (!configured) {
      // A schedule left by an earlier configuration would queue jobs nobody runs
      if (await boss.getQueue(QUEUE_NAME)) await boss.unschedule(QUEUE_NAME);
      sails.log.info(
        `BotPipelineQueueService: not configured (${reason}), skipping`
      );
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    if (botSurface.enabled) {
      await boss.schedule(QUEUE_NAME, botSurface.schedule, null, {
        tz: 'UTC',
        missed: 'once',
      });
    } else {
      await boss.unschedule(QUEUE_NAME);
    }
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info(
      `BotPipelineQueueService: started and listening for jobs (types ${botSurface.entityTypes.join(
        ','
      )}, storage ${botSurface.storage.driver}, ${
        botSurface.enabled
          ? `scheduled "${botSurface.schedule}" UTC`
          : 'not scheduled: BOT_SURFACE_ENABLED is not true, manual runs only'
      })`
    );
  },

  /**
   * Put one run in the queue. Used by scripts/bot-surface-run.js with its own
   * pg-boss instance.
   *
   * @param {object} boss a started PgBoss
   * @returns {Promise<{enqueued: boolean, jobId: ?string}>} `enqueued` is false
   *   when a run is already queued or running
   * @throws when the surface is not configured
   */
  async enqueue(boss) {
    const { configured, reason } = checkConfigured();
    if (!configured) {
      throw Object.assign(
        new Error(`The bot surface is not configured: ${reason}`),
        { code: 'E_BOT_NOT_CONFIGURED' }
      );
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    const jobId = await boss.send(QUEUE_NAME, { trigger: 'manual' });
    return { enqueued: Boolean(jobId), jobId: jobId || null };
  },

  /**
   * One run. Throwing lets pg-boss record the failure; the failure is logged
   * and recorded in t_bot_pipeline_run by the pipeline itself.
   *
   * @param {Array<{signal: AbortSignal, data: ?{trigger: string}}>} jobs a
   *   single job (batchSize 1)
   */
  async processJob([job] = []) {
    // Required here rather than at load time: a top-level require would pin
    // stale copies of the services it depends on (see SearchOutboxQueueService)
    // eslint-disable-next-line global-require
    const BotPipelineService = require('./bot/BotPipelineService');
    await BotPipelineService.run({
      signal: job?.signal,
      trigger: job?.data?.trigger ?? 'schedule',
    });
  },
};
