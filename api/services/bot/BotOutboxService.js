/**
 * BotOutboxService.js
 *
 * @description :: The withdrawal worker (#1886): removes or re-renders, within
 *   minutes, the bot pages that a change affects. BotOutboxQueueService runs
 *   it every minute.
 *
 * Change capture is t_bot_outbox (sql/9_37_2026_11_06_bot_outbox.sql), filled
 * by the triggers of the search outbox in the transaction of each write. One
 * run:
 *
 *   1. takes the generator's advisory lock (BotPageGeneratorService.withRunLock).
 *      When a generation or sitemap run holds it, the run is SKIPPED: nothing is
 *      read, the rows stay for the next minute;
 *   2. trims the rows older than the retention (bot_outbox_trim());
 *   3. reads a batch of rows, oldest first, and works out the PAGES they
 *      affect (pagesOf). The search outbox's fan-out (api/dbSync/searchOutbox.js
 *      `expand`) is reused, with every row read as a delete: the page does not
 *      depend on which column changed (a sensitivity flag, which the search
 *      fan-out ignores, is exactly what removes a page), so the old and the
 *      current cave and massifs are always followed;
 *   4. for each affected page re-reads v_bot_page (and v_bot_redirect) by
 *      (type, id), the SAME views as the nightly run:
 *        - row present: render with the generator's code (BotPublishService)
 *          and upload when the hash differs from the manifest's;
 *        - merged into a publishable target (v_bot_redirect): publish the
 *          redirect page like the generator does;
 *        - neither: delete the file, then the manifest row;
 *   5. deletes the exact ids of the rows it read, ONLY after every page of the
 *      batch is handled. A failure anywhere leaves the batch in place, and the
 *      next run starts it again (everything above is idempotent).
 *
 * What it never does: publish what the nightly run would not (same views, same
 * renderer, same gates), admit a record (admission, the text scan and the
 * 30-day age gate stay nightly), or touch a hub page. The hubs are left to the
 * nightly run: rebuilding them reads every published cave. The worker only
 * needs the KEYS of the published hubs, to link a page to the same hubs the
 * nightly run does: it reads them from the manifest, never from v_bot_hub. So
 * a hub may keep listing a withdrawn cave's name until the next night; the
 * cave's page and details are gone within minutes.
 *
 * Publishing off (t_bot_surface_state, BotSurfaceStateService; #1887): the
 * worker uploads nothing, but it still deletes. A page it would have rendered
 * or re-rendered is deleted when its hash differs from the manifest's (the
 * change may be a withdrawal's reduced version, the stale page must not stay),
 * stays when unchanged, and is not uploaded when new. The outbox rows are
 * handled and removed as always. An unreadable or missing state counts as off.
 *
 * Bounded work: `batchSize` rows per batch, and no new batch starts once
 * `timeBudgetMs` is spent (the first batch of a run always completes, or the
 * rows of an oversized batch would never be handled). The lock is held for the
 * run, so the nightly pipeline must retry on E_BOT_PAGES_RUNNING.
 */

const mapLimit = require('../../utils/mapLimit');
const searchOutbox = require('../../dbSync/searchOutbox');
const BotPageGeneratorService = require('./BotPageGeneratorService');
const BotHubService = require('./BotHubService');
const BotPublishService = require('./BotPublishService');
const BotSurfaceStateService = require('./BotSurfaceStateService');
const botPagePaths = require('../../utils/botPagePaths');

const BATCH_SIZE = 500;
const TIME_BUDGET_MS = 45 * 1000;
const CONCURRENCY = 4;
// Ids read from v_bot_page in one query
const READ_CHUNK = 100;

const query = (sql, params) => CommonService.query(sql, params);

// The table of each page type, for the merged records
const TABLES = { cave: 't_cave', massif: 't_massif', organization: 't_grotto' };

// A description is read as a name of the same entity: both change the page of
// the entity and of what lists it
const KIND_ALIASES = {
  entrance_description: 'entrance_name',
  cave_description: 'cave_name',
  massif_description: 'massif_name',
};
// Rows of a table, whose fan-out depends on the columns that changed
const ROW_KINDS = ['entrance', 'cave', 'massif', 'organization'];

const emptyCounts = () => ({
  rows: 0,
  pages: 0,
  rendered: 0,
  uploaded: 0,
  redirected: 0,
  deleted: 0,
  unchanged: 0,
  withheld: 0,
});

// The counter of each outcome of publishOrWithhold
const COUNT_OF = {
  uploaded: 'uploaded',
  unchanged: 'unchanged',
  withdrawn: 'deleted',
  withheld: 'withheld',
};

const idsOf = (rows, column = 'id') => rows.map((r) => r[column]);

// What the search fan-out is given: a row of a table is read as a delete,
// which treats every fan-out column as changed
const forFanOut = (row) => {
  const kind = KIND_ALIASES[row.kind] || row.kind;
  if (ROW_KINDS.includes(kind)) {
    return { ...row, kind, operation: 'D', oldValues: row.oldValues ?? {} };
  }
  return { ...row, kind };
};

/**
 * The pages affected by outbox rows.
 *
 * @param {Array<{kind: string, entityId: number, operation: string, oldValues: ?object}>} rows
 * @returns {Promise<{cave: number[], massif: number[], organization: number[]}>}
 *   sorted ids by page type. Includes the records merged into the affected
 *   ones: their redirect page points to the final target of the chain.
 */
async function pagesOf(rows) {
  const targets = await searchOutbox.expand(rows.map(forFanOut));

  // A cave page shows its entrances: the caves of the affected entrances
  const caves = new Set(targets.caves);
  if (targets.entrances.size > 0) {
    (
      await searchOutbox.queryIds(
        'SELECT DISTINCT id_cave AS id FROM t_entrance WHERE id = ANY($1::int[]) AND id_cave IS NOT NULL',
        [[...targets.entrances]]
      )
    ).forEach((id) => caves.add(id));
  }

  // A massif page lists its caves, and a cave page its massifs: the massifs
  // that hold an entrance of an affected cave, whatever the state of the
  // entrance (a withdrawn cave leaves the list of the massif it was in)
  const massifs = new Set(targets.massifs);
  if (caves.size > 0) {
    (
      await searchOutbox.queryIds(
        `SELECT DISTINCT m.id FROM t_entrance e
           JOIN t_massif m ON e.point_geom && m.geog_polygon::geometry
            AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
          WHERE e.id_cave = ANY($1::int[]) AND m.is_deleted = false`,
        [[...caves]]
      )
    ).forEach((id) => massifs.add(id));
  }

  const organizations = new Set(targets.organizations);
  const withMerged = async (type, set) =>
    (await searchOutbox.withMerged(TABLES[type], set)).sort((a, b) => a - b);
  return {
    cave: await withMerged('cave', caves),
    massif: await withMerged('massif', massifs),
    organization: await withMerged('organization', organizations),
  };
}

const readViewRows = async (type, ids) => {
  const { rows } = await query(
    `SELECT entity_type, entity_id, language, lastmod, page
       FROM v_bot_page
      WHERE entity_type = $1 AND entity_id = ANY($2::int[])`,
    [type, ids]
  );
  return new Map(rows.map((row) => [row.entity_id, row]));
};

// The merged records among `ids` that v_bot_redirect points somewhere. The
// view walks every merge chain, so it is read only for the ids that are
// merged at all.
const readRedirects = async (type, ids) => {
  if (ids.length === 0) return new Map();
  const { rows: merged } = await query(
    `SELECT id FROM ${TABLES[type]} WHERE id = ANY($1::int[]) AND redirect_to IS NOT NULL`,
    [ids]
  );
  if (merged.length === 0) return new Map();
  const { rows } = await query(
    `SELECT entity_id, target_id FROM v_bot_redirect
      WHERE entity_type = $1 AND entity_id = ANY($2::int[])`,
    [type, idsOf(merged)]
  );
  return new Map(rows.map((r) => [r.entity_id, r.target_id]));
};

// The render options of the run: those of the nightly run, with the hub links
// of the hubs that are online
const loadRenderOptions = async () => {
  const hubs = await BotHubService.loadPublishedHubs();
  const baseUrl = BotPublishService.resolveBaseUrl();
  return {
    hubs,
    renderOptions: await BotPublishService.loadRenderOptions({
      baseUrl,
      hubLinks: BotHubService.createHubLinks(hubs, baseUrl),
    }),
  };
};

// Handles the pages of one type and returns what it did
async function handleChunk(
  type,
  ids,
  { adapter, renderOptions, hubs, entityTypes, publishing }
) {
  const counts = emptyCounts();
  // A type that is not listed (BOT_SURFACE_ENTITY_TYPES) is never published,
  // so it reads as absent: what is online of it is deleted, nothing is put
  const listed = entityTypes.includes(type);
  const viewRows = listed ? await readViewRows(type, ids) : new Map();
  const absent = ids.filter((id) => !viewRows.has(id));
  const redirects = listed ? await readRedirects(type, absent) : new Map();
  const known = await BotPublishService.manifestHashes(
    ids.map((id) => botPagePaths.toKey(type, id))
  );
  const options =
    type === 'massif'
      ? {
          ...renderOptions,
          massifExtras: await BotHubService.massifExtras(
            [...viewRows.keys()],
            {
              regionsOfMassif: await BotHubService.regionsOfMassifs(
                [...viewRows.keys()],
                hubs
              ),
            },
            { concurrency: CONCURRENCY }
          ),
        }
      : renderOptions;

  await mapLimit(ids, CONCURRENCY, async (id) => {
    const path = botPagePaths.toKey(type, id);
    const row = viewRows.get(id);
    if (row) {
      counts.rendered += 1;
      const outcome = await BotPublishService.publishOrWithhold(
        adapter,
        BotPublishService.pagePublication(row, options),
        known.get(path),
        { publishing }
      );
      counts[COUNT_OF[outcome]] += 1;
    } else if (redirects.has(id)) {
      counts.rendered += 1;
      const outcome = await BotPublishService.publishOrWithhold(
        adapter,
        BotPublishService.redirectPublication(
          type,
          id,
          redirects.get(id),
          renderOptions
        ),
        known.get(path),
        { publishing }
      );
      counts[outcome === 'uploaded' ? 'redirected' : COUNT_OF[outcome]] += 1;
    } else if (known.has(path)) {
      // The file first, then the manifest row: a crash in between leaves a
      // row whose delete the next run repeats (deleting a gone path is fine)
      await adapter.delete(path);
      await BotPublishService.forgetPublished(path);
      counts.deleted += 1;
    }
  });
  return counts;
}

async function runLocked({
  adapter,
  batchSize,
  timeBudgetMs,
  signal,
  entityTypes,
}) {
  const deadline = Date.now() + timeBudgetMs;
  const counts = emptyCounts();
  await query('SELECT bot_outbox_trim()');
  let context;
  // Read when the first batch is found (an idle minute reads nothing), once
  let publishing;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await query(
      `SELECT id, kind, id_entity AS "entityId", operation, old_values AS "oldValues"
         FROM t_bot_outbox ORDER BY id LIMIT $1`,
      [batchSize]
    );
    if (rows.length === 0) break;
    // eslint-disable-next-line no-await-in-loop
    context = context || (await loadRenderOptions());
    // eslint-disable-next-line no-await-in-loop
    publishing = publishing ?? (await BotSurfaceStateService.isPublishing());
    // eslint-disable-next-line no-await-in-loop
    const pages = await pagesOf(rows);
    // eslint-disable-next-line no-restricted-syntax
    for (const [type, ids] of Object.entries(pages)) {
      counts.pages += ids.length;
      for (let i = 0; i < ids.length; i += READ_CHUNK) {
        signal?.throwIfAborted();
        // eslint-disable-next-line no-await-in-loop
        const done = await handleChunk(type, ids.slice(i, i + READ_CHUNK), {
          adapter,
          entityTypes,
          publishing,
          ...context,
        });
        Object.keys(done).forEach((key) => {
          counts[key] += done[key];
        });
      }
    }
    signal?.throwIfAborted();
    // Only now: every page of the batch is handled
    // eslint-disable-next-line no-await-in-loop
    await query('DELETE FROM t_bot_outbox WHERE id = ANY($1::bigint[])', [
      idsOf(rows),
    ]);
    counts.rows += rows.length;
    if (rows.length < batchSize || Date.now() > deadline) break;
  }
  return counts;
}

module.exports = {
  BATCH_SIZE,
  TIME_BUDGET_MS,

  pagesOf,

  /**
   * One run of the worker (see the top of the file).
   *
   * @param {object} options
   * @param {object} options.adapter storage adapter
   * @param {number} [options.batchSize] outbox rows per batch
   * @param {number} [options.timeBudgetMs] no new batch starts after it
   * @param {AbortSignal} [options.signal] the signal of the pg-boss job
   * @param {string[]} [options.entityTypes] the types listed
   *   (BOT_SURFACE_ENTITY_TYPES); default: the three page types. The worker
   *   never publishes a type that is not listed; it still deletes the pages
   *   of one it is asked about. 'hub' is of no concern to it (hubs are left
   *   to the nightly run).
   * @returns {Promise<{skipped: boolean, rows: number, pages: number,
   *   rendered: number, uploaded: number, redirected: number, deleted: number,
   *   unchanged: number}>} `skipped` is true, and nothing was read, when a
   *   generation or sitemap run holds the lock
   * @throws when a page cannot be handled; the batch stays in the outbox
   */
  async run({
    adapter,
    batchSize = BATCH_SIZE,
    timeBudgetMs = TIME_BUDGET_MS,
    signal,
    entityTypes = botPagePaths.ENTITY_TYPES,
  } = {}) {
    if (!adapter) throw new Error('BotOutboxService.run needs an adapter');
    try {
      const counts = await BotPageGeneratorService.withRunLock(
        async () =>
          runLocked({
            adapter,
            batchSize,
            timeBudgetMs,
            signal,
            entityTypes,
          }),
        'bot-outbox-worker'
      );
      return { skipped: false, ...counts };
    } catch (err) {
      if (err.code === 'E_BOT_PAGES_RUNNING') {
        return { skipped: true, ...emptyCounts() };
      }
      throw err;
    }
  },

  /** The rows waiting: their count and the age of the oldest, in seconds. */
  async backlog() {
    const { rows } = await query(
      `SELECT count(*)::int AS pending,
         COALESCE(EXTRACT(EPOCH FROM now() - min(date_inscription)), 0)::int AS "oldestSeconds"
       FROM t_bot_outbox`
    );
    return rows[0];
  },
};
