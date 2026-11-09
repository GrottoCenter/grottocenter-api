/**
 * BotPipelineService.js
 *
 * @description :: The nightly bot-surface pipeline (#1760): six steps in a fixed
 *   order, and the record of what each run did (t_bot_pipeline_run,
 *   sql/9_38_2026_11_06_bot_pipeline_run.sql). BotPipelineQueueService schedules
 *   it as the pg-boss job `bot-surface-nightly`; this file holds the logic.
 *
 *   step  name          owner                      on failure
 *   1     invariant     bot_cascade_check()        stop
 *   2     scan          BotTextScanService         stop
 *   3     admission     bot_admit_pages()          stop
 *   4     generation    BotPageGeneratorService    stop (the manifest stays
 *                                                  consistent with what is online)
 *   5     sitemaps      BotSitemapService          the previous sitemaps stay;
 *                                                  step 6 still runs
 *   6     audit         #1887 (not built)          handled by #1887
 *
 * The order is the contract. The scan runs before admission because the content
 * rule reads the verdicts (a description written 30 days ago and scanned tonight
 * counts tonight); admission runs before generation, so a record turning 30 days
 * old tonight is published tonight. Steps 1 and 2 failing means nothing is
 * uploaded or deleted: the run stops before step 4.
 *
 * Step 6 is a hook: `steps.audit`. Until #1887 replaces its body it records
 * `{ skipped: 'not implemented' }` in the run record, and the orchestrator does
 * not change.
 *
 * Allow-list: `entityTypes` (BOT_SURFACE_ENTITY_TYPES, #1888) goes to the
 * generator and to the sitemaps. An empty list is refused: nothing is generated.
 *
 * The page lock (BotPageGeneratorService.LOCK_KEY): steps 4 and 5 reject with
 * E_BOT_PAGES_RUNNING while another holder has it, in practice the withdrawal
 * worker (up to ~45 s per run, every minute). Each step retries every
 * `retry.intervalMs` (default 5 s) up to `retry.maxAttempts` times (default 60,
 * about 5 minutes), then fails with E_BOT_PAGES_LOCK_TIMEOUT.
 *
 * Overlap: pg-boss's `exclusive` queue keeps two jobs from running together;
 * run() also takes a session-level advisory lock (PIPELINE_LOCK_KEY) for the
 * whole run and rejects with E_BOT_PIPELINE_RUNNING when it is held, so a
 * direct call cannot overlap either. Because that lock proves no other run is
 * alive, a row still `running` when a run starts belongs to a dead process and
 * is marked failed ('abandoned').
 *
 * Run record: a row is inserted at the start and updated after every step, so
 * a crash leaves what was done. Rows older than a year are deleted at the start
 * of each run.
 */

const {
  ENTITY_TYPES: LISTABLE_TYPES,
} = require('../../utils/botSurfaceConfig');
const BotPageGeneratorService = require('./BotPageGeneratorService');

// Any key no other advisory lock uses (1758 pages, 1871 search write lock)
const PIPELINE_LOCK_KEY = 1760;
const RETENTION = '1 year';
const DEFAULT_RETRY = Object.freeze({ intervalMs: 5000, maxAttempts: 60 });
const ERROR_MAX_LENGTH = 4000;

const STEP_NAMES = Object.freeze({
  1: 'invariant',
  2: 'scan',
  3: 'admission',
  4: 'generation',
  5: 'sitemaps',
  6: 'audit',
});
const STEP_LABELS = Object.freeze({
  invariant: 'sensitivity invariant check',
  scan: 'text scan',
  admission: 'admission',
  generation: 'page generation',
  sitemaps: 'sitemaps',
  audit: 'audit',
});
const SITEMAP_STEP = 5;

const query = (sql, params, db) => CommonService.query(sql, params, db);

const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toMb = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/**
 * Calls `fn`, again after a pause each time it rejects with E_BOT_PAGES_RUNNING,
 * up to `maxAttempts` calls in all. Any other error goes through at once.
 */
async function withLockRetry(fn, { label, retry, sleep, signal }) {
  const { intervalMs, maxAttempts } = retry;
  for (let attempt = 1; ; attempt += 1) {
    try {
      // The attempts are sequential on purpose
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      if (err.code !== 'E_BOT_PAGES_RUNNING') throw err;
      if (attempt >= maxAttempts) {
        throw Object.assign(
          new Error(
            `${label}: the page lock stayed held through ${attempt} attempts, ${intervalMs} ms apart (${err.message}); the withdrawal worker or another run holds it`
          ),
          { code: 'E_BOT_PAGES_LOCK_TIMEOUT', cause: err }
        );
      }
      sails.log.info(
        `bot-surface-nightly: ${label} waits for the page lock (attempt ${attempt} of ${maxAttempts})`
      );
      signal?.throwIfAborted();
      // eslint-disable-next-line no-await-in-loop
      await sleep(intervalMs);
    }
  }
}

// Runs `fn` holding the pipeline lock, or rejects at once when it is held
const withPipelineLock = (fn) =>
  sails.getDatastore().leaseConnection(async (db) => {
    const {
      rows: [{ locked }],
    } = await query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [PIPELINE_LOCK_KEY],
      db
    );
    if (!locked) {
      throw Object.assign(
        new Error('bot-surface-nightly: another run is in progress'),
        { code: 'E_BOT_PIPELINE_RUNNING' }
      );
    }
    try {
      return await fn();
    } finally {
      // The connection sat idle for the whole run and may have been closed
      // underneath (an idle timeout, a failover): the lock went with the
      // session, there is nothing to release, and the unlock failing must not
      // turn a run that succeeded into a failed job
      await query(
        'SELECT pg_advisory_unlock($1)',
        [PIPELINE_LOCK_KEY],
        db
      ).catch((err) =>
        sails.log.warn(
          'bot-surface-nightly: could not release the pipeline lock',
          err
        )
      );
    }
  });

const byTypeCounts = (rows, column) =>
  Object.fromEntries(rows.map((row) => [row.entity_type, row[column]]));

// What is online after step 4, from the manifest: pages and redirect pages per type
async function countPublished() {
  const { rows } = await query(
    `SELECT entity_type,
            count(*) FILTER (WHERE redirect_to IS NULL)::int AS pages,
            count(*) FILTER (WHERE redirect_to IS NOT NULL)::int AS redirects
       FROM t_bot_page_manifest
      WHERE entity_type <> 'static'
      GROUP BY entity_type`
  );
  return {
    pages: byTypeCounts(rows, 'pages'),
    redirects: byTypeCounts(rows, 'redirects'),
  };
}

/**
 * The steps. `run` calls them as `steps.<name>(context)` so that a test, or
 * #1887 for the audit, replaces one without touching the orchestrator. Each
 * returns what goes into the run record under its name; a rejection fails the
 * step.
 */
const steps = {
  /** Step 1. A violation (a non-sensitive, unlocked entrance inside a sensitive massif) stops the run. */
  async invariant() {
    const {
      rows: [row],
    } = await query('SELECT * FROM bot_cascade_check()');
    const result = {
      violations: Number(row.violation_count),
      overrides: Number(row.override_count),
    };
    if (result.violations > 0) {
      throw Object.assign(
        new Error(
          `bot_cascade_check found ${result.violations} entrance(s) inside a sensitive massif that are not marked sensitive (ids ${row.violation_ids.join(', ')})`
        ),
        { code: 'E_BOT_CASCADE_VIOLATION' }
      );
    }
    return result;
  },

  /** Step 2. Per-source scanned and quarantined counts, from the scan's summary. */
  async scan() {
    const summary = await sails.services.bottextscanservice.run();
    return {
      patternVersion: summary.patternVersion,
      scanned: summary.scanned,
      quarantined: summary.quarantined,
      errors: summary.errors,
      passes: summary.passes,
    };
  },

  /** Step 3. Admitted tonight, per type. */
  async admission() {
    const { rows } = await query('SELECT * FROM bot_admit_pages()');
    const admitted = Object.fromEntries(
      rows.map((row) => [row.entity_type, Number(row.admitted)])
    );
    return {
      ...admitted,
      total: Object.values(admitted).reduce((sum, n) => sum + n, 0),
    };
  },

  /** Step 4. Generate, publish and delete; waits for the page lock. */
  async generation({ adapter, entityTypes, retry, sleep, signal }) {
    const summary = await withLockRetry(
      () => BotPageGeneratorService.run({ adapter, entityTypes }),
      { label: 'generation', retry, sleep, signal }
    );
    return { ...summary, ...(await countPublished()) };
  },

  /** Step 5. Sitemaps from the manifest; waits for the page lock. */
  async sitemaps({ adapter, entityTypes, retry, sleep, signal }) {
    // Required here: see BotPipelineQueueService (stale copies after a relift)
    // eslint-disable-next-line global-require
    const BotSitemapService = require('./BotSitemapService');
    return withLockRetry(
      () => BotSitemapService.run({ adapter, entityTypes }),
      { label: 'sitemaps', retry, sleep, signal }
    );
  },

  /**
   * Step 6, the hook for the audit (#1887): replace this body with the audit
   * and return its counts (pages audited, failures); throw to fail the run.
   * The orchestrator needs no change.
   */
  async audit() {
    return { skipped: 'not implemented' };
  },
};

const recordFailure = (message) => String(message).slice(0, ERROR_MAX_LENGTH);

async function openRecord(counts) {
  // Holding the pipeline lock: no other run is alive, so a row still running
  // belongs to a process that died
  await query(
    `UPDATE t_bot_pipeline_run
        SET status = 'failed', finished_at = now(),
            error = 'abandoned: the process stopped before the run ended'
      WHERE status = 'running'`
  );
  await query(
    `DELETE FROM t_bot_pipeline_run WHERE started_at < now() - interval '${RETENTION}'`
  );
  const {
    rows: [{ id }],
  } = await query(
    'INSERT INTO t_bot_pipeline_run (counts) VALUES ($1) RETURNING id',
    [JSON.stringify(counts)]
  );
  return id;
}

// A record that cannot be written must not undo a run that has published
const saveRecord = async (id, fields) => {
  try {
    await query(
      `UPDATE t_bot_pipeline_run
          SET status = COALESCE($2, status),
              failed_step = $3,
              finished_at = CASE WHEN $4::boolean THEN now() ELSE finished_at END,
              step_durations = $5,
              counts = $6,
              error = $7
        WHERE id = $1`,
      [
        id,
        fields.status ?? null,
        fields.failedStep ?? null,
        Boolean(fields.finished),
        JSON.stringify(fields.durations),
        JSON.stringify(fields.counts),
        fields.error ?? null,
      ]
    );
  } catch (err) {
    sails.log.error(
      `bot-surface-nightly: could not write run ${id} to t_bot_pipeline_run`,
      err
    );
  }
};

const summaryLine = (counts, durationMs) => {
  const sum = (object = {}) =>
    Object.values(object).reduce((total, n) => total + n, 0);
  const audit = counts.audit?.skipped ? 'skipped' : 'done';
  return (
    `admitted=${counts.admission?.total ?? 0} ` +
    `scanned=${sum(counts.scan?.scanned)} quarantined=${sum(counts.scan?.quarantined)} ` +
    `uploaded=${counts.generation?.uploaded ?? 0} deleted=${counts.generation?.deleted ?? 0} ` +
    `unchanged=${counts.generation?.unchanged ?? 0} ` +
    `sitemapUrls=${counts.sitemaps?.urls ?? 0} shards=${counts.sitemaps?.shards ?? 0} ` +
    `audit=${audit} peakRssMb=${counts.peakRssMb} durationMs=${durationMs}`
  );
};

async function execute(options) {
  const { adapter, entityTypes, retry, sleep, signal, trigger } = options;
  const counts = { trigger, entityTypes };
  const durations = {};
  const startedAt = Date.now();
  let peakRss = process.memoryUsage().rss;
  const sample = () => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
    counts.peakRssMb = toMb(peakRss);
  };
  sample();

  // Before the sampler starts: if the record cannot be opened (migration not
  // applied, database unreachable) nothing is left running
  const id = await openRecord(counts);
  const sampler = setInterval(sample, 1000);
  sampler.unref();
  sails.log.info(
    `bot-surface-nightly: started run ${id} (${trigger}) for ${entityTypes.join(',')}`
  );

  let failure = null;
  try {
    for (const n of Object.keys(STEP_NAMES).map(Number)) {
      const name = STEP_NAMES[n];
      const stepStart = Date.now();
      try {
        signal?.throwIfAborted();
        // The steps are sequential by design
        // eslint-disable-next-line no-await-in-loop
        counts[name] = await steps[name]({
          adapter,
          entityTypes,
          retry,
          sleep,
          signal,
        });
      } catch (err) {
        failure = failure || { step: n, error: err };
        sails.log.error(
          `bot-surface-nightly failed at step ${n} (${STEP_LABELS[name]}): ${err.message}`,
          err
        );
        counts[name] = { failed: true };
      }
      durations[name] = Date.now() - stepStart;
      sample();
      // eslint-disable-next-line no-await-in-loop
      await saveRecord(id, { durations, counts });
      // The sitemaps failing keeps the previous ones; the audit still runs
      if (failure && failure.step !== SITEMAP_STEP) break;
    }
  } finally {
    clearInterval(sampler);
  }
  sample();

  const durationMs = Date.now() - startedAt;
  if (failure) {
    await saveRecord(id, {
      status: 'failed',
      failedStep: failure.step,
      finished: true,
      durations,
      counts,
      error: recordFailure(
        `${failure.error.code ? `${failure.error.code}: ` : ''}${failure.error.message}`
      ),
    });
    throw Object.assign(failure.error, { failedStep: failure.step, runId: id });
  }
  await saveRecord(id, {
    status: 'succeeded',
    finished: true,
    durations,
    counts,
  });
  sails.log.info(
    `bot-surface-nightly succeeded (run ${id}): ${summaryLine(counts, durationMs)}`
  );
  return { id, counts, durations, durationMs };
}

module.exports = {
  PIPELINE_LOCK_KEY,
  DEFAULT_RETRY,
  STEP_NAMES,
  steps,

  /**
   * One run of the pipeline.
   *
   * @param {object} [options]
   * @param {object} [options.adapter] storage adapter (default: the one of
   *   sails.config.custom.botSurface.storage)
   * @param {string[]} [options.entityTypes] the allow-list (default:
   *   sails.config.custom.botSurface.entityTypes). Must not be empty.
   * @param {{intervalMs: number, maxAttempts: number}} [options.retry] the page
   *   lock wait of steps 4 and 5
   * @param {Function} [options.sleep] (ms) => Promise, for tests
   * @param {AbortSignal} [options.signal] the signal of the pg-boss job
   * @param {string} [options.trigger] 'schedule' or 'manual', recorded
   * @returns {Promise<{id: number, counts: object, durations: object, durationMs: number}>}
   * @throws the error of the failed step, with `failedStep` and `runId`;
   *   E_BOT_PIPELINE_RUNNING when a run is in progress (nothing is recorded);
   *   E_BOT_NOT_CONFIGURED when no entity type is listed
   */
  async run(options = {}) {
    const { botSurface } = sails.config.custom;
    const entityTypes = options.entityTypes ?? botSurface.entityTypes ?? [];
    if (entityTypes.length === 0) {
      throw Object.assign(
        new Error(
          'bot-surface-nightly: BOT_SURFACE_ENTITY_TYPES lists no type, nothing to generate'
        ),
        { code: 'E_BOT_NOT_CONFIGURED' }
      );
    }
    entityTypes.forEach((type) => {
      if (!LISTABLE_TYPES.includes(type)) {
        throw new RangeError(`Unknown bot entity type: ${type}`);
      }
    });
    // Required here rather than at load time: see BotOutboxQueueService
    // eslint-disable-next-line global-require
    const { createStorageAdapter } = require('./storage');
    return withPipelineLock(() =>
      execute({
        adapter: options.adapter ?? createStorageAdapter(botSurface.storage),
        entityTypes,
        retry: { ...DEFAULT_RETRY, ...options.retry },
        sleep: options.sleep ?? defaultSleep,
        signal: options.signal,
        trigger: options.trigger ?? 'schedule',
      })
    );
  },
};
