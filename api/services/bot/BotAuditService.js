/**
 * BotAuditService.js
 *
 * @description :: Step 6 of the nightly bot-surface pipeline (#1887): the
 *   audit of what is actually ONLINE. Every protection upstream (the view's
 *   gates, the field whitelist, the text scan, the withdrawal worker) is on the
 *   input side and tested on fixtures; this reads the pages BACK from the
 *   storage adapter, as crawlers see them, and checks them independently of
 *   how they were built.
 *
 * Which pages (from t_bot_page_manifest, never the static rows: the sitemap
 * files and 404.html):
 *   1. every page uploaded tonight, `published_at >= since` (the start of the
 *      run, from the database clock), redirect pages and hubs included, read by
 *      keyset on the path, `batchSize` at a time;
 *   2. a random sample of `sampleSize` others (ORDER BY random() LIMIT), as
 *      many as exist when there are fewer.
 *
 * Checks, per page:
 *   a. coordinates: api/utils/coordinateDetector.js over the page's text and
 *      over its JSON-LD (api/utils/botAuditPage.js shapes the input: markup
 *      stripped, attributes and script contents kept, entities decoded);
 *   b. sensitive records: every cave, massif, organization and entrance the
 *      page links to or carries, and the page's own record, cross-checked in
 *      batches by id against the base tables. A sensitive entrance or massif,
 *      a record that is missing, deleted or merged, and a cave with no public
 *      entrance (not sensitive, not deleted, not merged) are failures. A
 *      redirect page is for a merged record by definition: its own record is
 *      not checked, its target (the only record it links) is;
 *   c. variant (a sample of `variantSample` published addresses, 0 disables):
 *      the public SPA address is requested with an ordinary browser
 *      User-Agent. The response must be the SPA shell: the generator's marker
 *      `<meta name="generator" content="gc-static-pages">` in it means a cache
 *      layer served the crawler variant to humans, a failure. A network error
 *      or a non-2xx answer proves nothing about the page: it is counted as
 *      `variantUnreachable`, never a failure, and nothing is deleted for it.
 *
 * A page that cannot be read back (no blob for a manifest row) is counted as
 * `missing` and logged as a warning: it leaks nothing. A page over
 * `maxPageBytes` fails closed (`too-large`).
 *
 * A failing page is DELETED at once through the adapter and its manifest row
 * removed (a redirect page too), under the page lock (the withdrawal worker
 * would otherwise race the manifest row and leave a page online without one;
 * the audit retries while the worker holds it). One distinct error line per
 * page: `bot-surface-audit failure <path>: <reason>`. More than `failureLimit`
 * failures in one run set t_bot_surface_state.publishing = false and log
 * `bot-surface-audit publishing stopped: ...`: the pipeline and the worker then
 * upload nothing until an operator sets it back (docs/bot-surface.md).
 *
 * The sitemaps keep naming a deleted page until the next night's step 5.
 *
 * Bounded: at most `concurrency` pages in flight, each capped at
 * `maxPageBytes`; of a batch only the ids found are held; a total time budget
 * (`timeBudgetMs`) after which no new batch starts and `truncated` is recorded
 * (the run does not fail); the variant check has a timeout per request and its
 * own spacing. The audit fails only on its own errors (an adapter or database
 * that cannot be read), never for a page failure.
 */

const botPagePaths = require('../../utils/botPagePaths');
const botAuditPage = require('../../utils/botAuditPage');
const { detect } = require('../../utils/coordinateDetector');
const { AUDIT_DEFAULTS } = require('../../utils/botSurfaceConfig');
const mapLimit = require('../../utils/mapLimit');
const BotPageGeneratorService = require('./BotPageGeneratorService');
const BotPublishService = require('./BotPublishService');
const BotSurfaceStateService = require('./BotSurfaceStateService');

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_MAX_PAGE_BYTES = 2 * 1024 * 1024;
const VARIANT_CONCURRENCY = 2;
const DEFAULT_VARIANT_TIMEOUT_MS = 10 * 1000;
const DEFAULT_VARIANT_SPACING_MS = 500;
const VARIANT_BODY_LIMIT = 2 * 1024 * 1024;
const ID_CHUNK = 5000;
const DEFAULT_LOCK_RETRY = Object.freeze({
  intervalMs: 2000,
  maxAttempts: 150,
});
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const GENERATOR_MARKER =
  /<meta\s+name\s*=\s*["']generator["']\s+content\s*=\s*["']gc-static-pages["']/i;

// The reasons, in the order a page reports the first that applies
const REASONS = Object.freeze({
  COORDINATES_BODY: 'coordinates-body',
  COORDINATES_JSON_LD: 'coordinates-json-ld',
  SENSITIVE_ENTRANCE: 'sensitive-entrance',
  SENSITIVE_MASSIF: 'sensitive-massif',
  NO_PUBLIC_ENTRANCE: 'no-public-entrance',
  MERGED_RECORD: 'merged-record',
  DELETED_RECORD: 'deleted-record',
  MISSING_RECORD: 'missing-record',
  TOO_LARGE: 'too-large',
  VARIANT_LEAK: 'variant-leak',
});
const RECORD_REASON_PRIORITY = [
  REASONS.SENSITIVE_ENTRANCE,
  REASONS.SENSITIVE_MASSIF,
  REASONS.NO_PUBLIC_ENTRANCE,
  REASONS.MERGED_RECORD,
  REASONS.DELETED_RECORD,
  REASONS.MISSING_RECORD,
];

const query = (sql, params) => CommonService.query(sql, params);

const chunks = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
};

const defaultSleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// ---- the base tables -------------------------------------------------------

// For each type, the rows of `ids` with what decides their reason
const RECORD_QUERIES = {
  cave: `SELECT c.id, c.is_deleted, c.redirect_to IS NOT NULL AS merged,
                false AS sensitive,
                EXISTS (SELECT 1 FROM t_entrance e
                         WHERE e.id_cave = c.id AND e.is_deleted = false
                           AND e.redirect_to IS NULL AND e.is_sensitive = false) AS has_public_entrance
           FROM t_cave c WHERE c.id = ANY($1::int[])`,
  massif: `SELECT id, is_deleted, redirect_to IS NOT NULL AS merged,
                  is_sensitive AS sensitive, true AS has_public_entrance
             FROM t_massif WHERE id = ANY($1::int[])`,
  organization: `SELECT id, is_deleted, redirect_to IS NOT NULL AS merged,
                        false AS sensitive, true AS has_public_entrance
                   FROM t_grotto WHERE id = ANY($1::int[])`,
  entrance: `SELECT id, is_deleted, redirect_to IS NOT NULL AS merged,
                    is_sensitive AS sensitive, true AS has_public_entrance
               FROM t_entrance WHERE id = ANY($1::int[])`,
};

const reasonOfRow = (type, row) => {
  if (row.sensitive) {
    return type === 'entrance'
      ? REASONS.SENSITIVE_ENTRANCE
      : REASONS.SENSITIVE_MASSIF;
  }
  if (row.merged) return REASONS.MERGED_RECORD;
  if (row.is_deleted) return REASONS.DELETED_RECORD;
  if (!row.has_public_entrance) return REASONS.NO_PUBLIC_ENTRANCE;
  return null;
};

/**
 * @param {{cave: Set<number>, massif: Set<number>, organization: Set<number>, entrance: Set<number>}} wanted
 * @returns {Promise<Map<string, string>>} `<type>:<id>` -> reason, for the
 *   records that are not fit to be on a public page
 */
async function badRecords(wanted) {
  const bad = new Map();
  for (const type of Object.keys(RECORD_QUERIES)) {
    const ids = [...wanted[type]];
    for (const part of chunks(ids, ID_CHUNK)) {
      // Sequential: one query at a time on the shared pool
      // eslint-disable-next-line no-await-in-loop
      const { rows } = await query(RECORD_QUERIES[type], [part]);
      const found = new Set(rows.map((row) => row.id));
      rows.forEach((row) => {
        const reason = reasonOfRow(type, row);
        if (reason) bad.set(`${type}:${row.id}`, reason);
      });
      part
        .filter((id) => !found.has(id))
        .forEach((id) => bad.set(`${type}:${id}`, REASONS.MISSING_RECORD));
    }
  }
  return bad;
}

// ---- one page --------------------------------------------------------------

// The records a page must be fit for: what it links to or carries, and its own
const refsOfPage = (html, row, baseUrl) => {
  const refs = botAuditPage.recordRefs(html, baseUrl);
  if (row.redirect_to === null || row.redirect_to === undefined) {
    const own = botPagePaths.fromKey(row.path);
    if (own && own.entityType !== 'hub') {
      refs[own.entityType] = [...new Set([...refs[own.entityType], own.id])];
    }
  }
  return refs;
};

// A reason when the page's text holds coordinates, with the family that matched
const coordinateFailure = (html) => {
  const { body, jsonLd } = botAuditPage.detectionText(html);
  const inBody = detect(body);
  if (inBody.matched) {
    return { reason: REASONS.COORDINATES_BODY, detail: inBody.patternId };
  }
  const inJsonLd = detect(jsonLd);
  if (inJsonLd.matched) {
    return { reason: REASONS.COORDINATES_JSON_LD, detail: inJsonLd.patternId };
  }
  return null;
};

/**
 * Reads, checks (a) and collects the references (b) of every page of `rows`.
 * Only the failure and the reference ids of each page are kept, not its HTML.
 */
async function readPages(
  rows,
  { adapter, concurrency, maxPageBytes, baseUrl }
) {
  const results = [];
  await mapLimit(rows, concurrency, async (row) => {
    let body;
    try {
      body = await adapter.get(row.path, { maxBytes: maxPageBytes });
    } catch (err) {
      if (err.code !== 'E_BOT_PAGE_TOO_LARGE') throw err;
      results.push({ row, failure: { reason: REASONS.TOO_LARGE } });
      return;
    }
    if (body === null) {
      results.push({ row, missing: true });
      return;
    }
    const html = body.toString('utf8');
    results.push({
      row,
      failure: coordinateFailure(html),
      refs: refsOfPage(html, row, baseUrl),
    });
  });
  return results;
}

// ---- the page lock and the deletes -----------------------------------------

async function deleteFailed(paths, { adapter, retry, sleep, signal }) {
  const { intervalMs, maxAttempts } = retry;
  for (let attempt = 1; ; attempt += 1) {
    try {
      // The attempts are sequential on purpose
      // eslint-disable-next-line no-await-in-loop
      await BotPageGeneratorService.withRunLock(async () => {
        for (const path of paths) {
          // The file first, then the row, as everywhere
          // eslint-disable-next-line no-await-in-loop
          await adapter.delete(path);
          // eslint-disable-next-line no-await-in-loop
          await BotPublishService.forgetPublished(path);
        }
      }, 'bot-surface-audit');
      return;
    } catch (err) {
      if (err.code !== 'E_BOT_PAGES_RUNNING') throw err;
      if (attempt >= maxAttempts) {
        throw Object.assign(
          new Error(
            `bot-surface-audit: the page lock stayed held through ${attempt} attempts, ${intervalMs} ms apart; ${paths.length} failing page(s) could not be deleted`
          ),
          { code: 'E_BOT_AUDIT_LOCK_TIMEOUT', cause: err }
        );
      }
      signal?.throwIfAborted();
      // eslint-disable-next-line no-await-in-loop
      await sleep(intervalMs);
    }
  }
}

// ---- the variant check -----------------------------------------------------

const addressOf = (row, baseUrl) => {
  const page = botPagePaths.fromKey(row.path);
  if (!page) return null;
  return page.entityType === 'hub'
    ? botPagePaths.toHubUrl(page.hubType, page.hubKey, baseUrl)
    : botPagePaths.toUrl(page.entityType, page.id, baseUrl);
};

// The first `limit` bytes of the body, read chunk by chunk: the request is
// aborted once the limit is reached, so a huge answer is never buffered
async function readCapped(response, limit, controller) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    return (await response.text()).slice(0, limit);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let text = '';
  let bytes = 0;
  for (;;) {
    // Sequential by nature
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
    // The marker is enough: no need to read the rest of the answer
    if (GENERATOR_MARKER.test(text) || bytes >= limit) {
      controller.abort();
      // eslint-disable-next-line no-await-in-loop
      await reader.cancel().catch(() => {});
      break;
    }
  }
  return text;
}

// 'leak', 'ok' or 'unreachable'
async function requestVariant(url, { fetchFn, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchFn(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': BROWSER_USER_AGENT, Accept: 'text/html' },
    });
    if (!response || !response.ok) return 'unreachable';
    const text = await readCapped(response, VARIANT_BODY_LIMIT, controller);
    return GENERATOR_MARKER.test(text) ? 'leak' : 'ok';
  } catch {
    // A network error or a timeout: nothing is known about the page
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

// ---- the run ---------------------------------------------------------------

const assertCount = (name, value, min) => {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(
      `BotAuditService.run needs an integer ${name} of at least ${min}, got ${value}`
    );
  }
};

module.exports = {
  REASONS,
  BROWSER_USER_AGENT,
  GENERATOR_MARKER,

  /**
   * @param {object} options
   * @param {object} options.adapter storage adapter (get, delete)
   * @param {Date|string} [options.since] the start of the run: pages published
   *   since then are all checked (default: 24 hours ago)
   * @param {number} [options.sampleSize] random pages besides tonight's
   *   (default: BOT_AUDIT_SAMPLE_SIZE, 1000)
   * @param {number} [options.failureLimit] more failures than this stop
   *   publishing (default: BOT_AUDIT_FAILURE_LIMIT, 10)
   * @param {number} [options.variantSample] addresses requested as a browser,
   *   0 disables (default: BOT_AUDIT_VARIANT_SAMPLE, 20)
   * @param {number} [options.timeBudgetMs] no new batch of pages starts after
   *   it (default: BOT_AUDIT_TIME_BUDGET_MS, 30 minutes)
   * @param {number} [options.batchSize] pages per batch
   * @param {number} [options.concurrency] pages read at a time
   * @param {number} [options.maxPageBytes] a page over it fails (too-large)
   * @param {Function} [options.fetch] (url, init) => Response, for the variant
   *   check (default: the global fetch)
   * @param {string} [options.baseUrl] the SPA's address (default: the config key)
   * @param {number} [options.variantTimeoutMs] per request
   * @param {number} [options.variantSpacingMs] pause after each request
   * @param {{intervalMs: number, maxAttempts: number}} [options.retry] the
   *   wait for the page lock before deleting
   * @param {Function} [options.sleep] (ms) => Promise, for tests
   * @param {Function} [options.now] () => ms, for tests
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} the counts of the run record: runAt,
   *   pagesChecked, uploadedChecked, sampled, missing, failures,
   *   failuresByReason, variantChecked, variantUnreachable, truncated,
   *   publishingStopped, publishing, durationMs
   * @throws on its own errors (adapter or database unreadable), never for a
   *   failing page
   */
  async run(options = {}) {
    const configured = sails.config.custom?.botSurface?.audit ?? {};
    const {
      adapter,
      since = new Date(Date.now() - 24 * 60 * 60 * 1000),
      sampleSize = configured.sampleSize ?? AUDIT_DEFAULTS.sampleSize,
      failureLimit = configured.failureLimit ?? AUDIT_DEFAULTS.failureLimit,
      variantSample = configured.variantSample ?? AUDIT_DEFAULTS.variantSample,
      timeBudgetMs = configured.timeBudgetMs ?? AUDIT_DEFAULTS.timeBudgetMs,
      batchSize = DEFAULT_BATCH_SIZE,
      concurrency = DEFAULT_CONCURRENCY,
      maxPageBytes = DEFAULT_MAX_PAGE_BYTES,
      fetch: fetchFn = global.fetch,
      baseUrl = sails.config.custom?.botSurface?.publicBaseUrl ??
        botPagePaths.DEFAULT_PUBLIC_BASE_URL,
      variantTimeoutMs = DEFAULT_VARIANT_TIMEOUT_MS,
      variantSpacingMs = DEFAULT_VARIANT_SPACING_MS,
      retry = DEFAULT_LOCK_RETRY,
      sleep = defaultSleep,
      now = Date.now,
      signal,
    } = options;
    if (!adapter || typeof adapter.get !== 'function') {
      throw new Error('BotAuditService.run needs an adapter with get()');
    }
    assertCount('sampleSize', sampleSize, 0);
    assertCount('failureLimit', failureLimit, 0);
    assertCount('variantSample', variantSample, 0);
    assertCount('timeBudgetMs', timeBudgetMs, 1);
    assertCount('batchSize', batchSize, 1);
    assertCount('concurrency', concurrency, 1);
    assertCount('maxPageBytes', maxPageBytes, 1);

    const startedAt = now();
    const deadline = startedAt + timeBudgetMs;
    const counts = {
      runAt: new Date(startedAt).toISOString(),
      pagesChecked: 0,
      uploadedChecked: 0,
      sampled: 0,
      missing: 0,
      failures: 0,
      failuresByReason: {},
      variantChecked: 0,
      variantUnreachable: 0,
      foreignRefs: 0,
      truncated: false,
      publishingStopped: false,
    };

    const fail = (path, { reason, detail }) => {
      counts.failures += 1;
      counts.failuresByReason[reason] =
        (counts.failuresByReason[reason] ?? 0) + 1;
      // Never the matched text: it would put the coordinates in the logs
      sails.log.error(
        `bot-surface-audit failure ${path}: ${reason}${detail ? ` (${detail})` : ''}`
      );
    };

    // Stops publishing, once, with the reason on the state row and in the logs
    const stopPublishing = async (reason, line) => {
      if (counts.publishingStopped) return;
      await BotSurfaceStateService.stopPublishing(reason);
      counts.publishingStopped = true;
      sails.log.error(`${line}: ${reason}`);
    };

    // As soon as the failures cross the limit, and not only at the end: an
    // error later in the run (the page lock never frees, an adapter or database
    // error) must not leave publishing on after the audit found the most
    const stopIfOverLimit = async () => {
      if (counts.failures <= failureLimit) return;
      const summary = Object.entries(counts.failuresByReason)
        .map(([reason, n]) => `${reason}=${n}`)
        .join(' ');
      await stopPublishing(
        `nightly audit ${counts.runAt}: ${counts.failures} pages failed (limit ${failureLimit}): ${summary}`,
        'bot-surface-audit publishing stopped'
      );
    };

    // Checks one batch of manifest rows; returns nothing, handles the failures
    const auditBatch = async (rows, phase) => {
      const results = await readPages(rows, {
        adapter,
        concurrency,
        maxPageBytes,
        baseUrl,
      });
      const wanted = {
        cave: new Set(),
        massif: new Set(),
        organization: new Set(),
        entrance: new Set(),
      };
      results.forEach(({ failure, refs }) => {
        if (refs) counts.foreignRefs += refs.foreign;
        if (failure || !refs) return;
        Object.keys(wanted).forEach((type) =>
          refs[type].forEach((id) => wanted[type].add(id))
        );
      });
      const bad = await badRecords(wanted);

      const failing = [];
      results.sort((a, b) => (a.row.path < b.row.path ? -1 : 1));
      results.forEach((result) => {
        counts[phase] += 1;
        counts.pagesChecked += 1;
        if (result.missing) {
          counts.missing += 1;
          sails.log.warn(
            `bot-surface-audit: ${result.row.path} is in the manifest but has no file online`
          );
          return;
        }
        let { failure } = result;
        if (!failure) {
          const reasons = Object.keys(wanted)
            .flatMap((type) =>
              result.refs[type].map((id) => bad.get(`${type}:${id}`))
            )
            .filter(Boolean);
          const reason = RECORD_REASON_PRIORITY.find((r) =>
            reasons.includes(r)
          );
          if (reason) failure = { reason };
        }
        if (failure) {
          fail(result.row.path, failure);
          failing.push(result.row.path);
        }
      });
      // Before the deletes, which can wait for the page lock for minutes or
      // fail: the switch must already be off by then
      await stopIfOverLimit();
      if (failing.length > 0) {
        await deleteFailed(failing, { adapter, retry, sleep, signal });
      }
    };

    const auditRows = async (rows, phase) => {
      for (const part of chunks(rows, batchSize)) {
        if (now() > deadline) {
          counts.truncated = true;
          return false;
        }
        signal?.throwIfAborted();
        // eslint-disable-next-line no-await-in-loop
        await auditBatch(part, phase);
      }
      return true;
    };

    let failure = null;
    try {
      // 1. Everything uploaded tonight, by keyset on the path
      let cursor = '';
      let more = true;
      while (more) {
        if (now() > deadline) {
          counts.truncated = true;
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        const { rows } = await query(
          `SELECT path, redirect_to FROM t_bot_page_manifest
            WHERE entity_type <> 'static' AND published_at >= $1 AND path > $2
            ORDER BY path LIMIT $3`,
          [since, cursor, batchSize]
        );
        if (rows.length === 0) break;
        // eslint-disable-next-line no-await-in-loop
        await auditBatch(rows, 'uploadedChecked');
        cursor = rows[rows.length - 1].path;
        more = rows.length === batchSize;
      }

      // 2. A random sample of the others
      if (sampleSize > 0 && !counts.truncated) {
        const { rows } = await query(
          `SELECT path, redirect_to FROM t_bot_page_manifest
            WHERE entity_type <> 'static' AND published_at < $1
            ORDER BY random() LIMIT $2`,
          [since, sampleSize]
        );
        await auditRows(rows, 'sampled');
      }

      // 3. The variant check on a sample of addresses that are still online
      if (variantSample > 0) {
        const { rows } = await query(
          `SELECT path FROM t_bot_page_manifest
            WHERE entity_type <> 'static' AND redirect_to IS NULL
            ORDER BY random() LIMIT $1`,
          [variantSample]
        );
        const leaking = [];
        await mapLimit(rows, VARIANT_CONCURRENCY, async (row) => {
          const url = addressOf(row, baseUrl);
          if (!url) return;
          const outcome = await requestVariant(url, {
            fetchFn,
            timeoutMs: variantTimeoutMs,
          });
          counts.variantChecked += 1;
          if (outcome === 'unreachable') counts.variantUnreachable += 1;
          if (outcome === 'leak') {
            fail(row.path, { reason: REASONS.VARIANT_LEAK });
            leaking.push(row.path);
          }
          // Spread the requests out
          await sleep(variantSpacingMs);
        });
        // A leak is a cache or rewrite layer serving the crawler page to
        // browsers: the blob is fine and every page is concerned, not only the
        // ones sampled. Deleting the sampled pages would fix nothing (the cache
        // keeps its copy, the next night uploads them again), so publishing stops
        // at the first one, whatever the limit, and the pages stay: it is fixed
        // in the CDN or cache configuration, not in the data
        if (leaking.length > 0) {
          await stopPublishing(
            `nightly audit ${counts.runAt}: ${leaking.length} sampled address(es) answered a browser with the crawler page (${leaking.slice(0, 3).join(', ')}); fix the cache or CDN rule, then re-enable publishing`,
            'bot-surface-audit variant leak, publishing stopped'
          );
        }
      }
    } catch (err) {
      failure = err;
    }
    // The limit, even when the run ends on an error of its own
    try {
      await stopIfOverLimit();
    } catch (err) {
      sails.log.error(
        'bot-surface-audit: could not stop publishing after the failures found',
        err
      );
      failure = failure ?? err;
    }
    if (failure) throw failure;

    if (counts.foreignRefs > 0) {
      sails.log.warn(
        `bot-surface-audit: ${counts.foreignRefs} reference(s) of the pages checked point at the SPA path on another origin than ${baseUrl}; the base URL was probably changed since those pages were rendered (they were checked all the same)`
      );
    }
    counts.publishing = (await BotSurfaceStateService.read()).publishing;
    counts.durationMs = now() - startedAt;
    return counts;
  },
};
