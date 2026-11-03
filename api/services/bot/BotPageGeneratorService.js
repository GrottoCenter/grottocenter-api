/**
 * BotPageGeneratorService.js
 *
 * @description :: Step 4 of the nightly bot-surface pipeline. Renders the pages
 *   of v_bot_page, publishes the ones that changed to a storage adapter, and
 *   removes the paths that are no longer produced.
 *
 * For each entity type (one at a time, entity_id is not unique across types)
 * it reads v_bot_page by keyset, `entity_id > cursor ORDER BY entity_id LIMIT
 * batchSize`, and for each batch:
 *
 *   1. renders each page and hashes the HTML (sha256). The hash of the HTML,
 *      never v_bot_page.lastmod, decides what changed: lastmod is a sitemap
 *      hint that can stay put when the content changes;
 *   2. uploads only the pages whose hash differs from t_bot_page_manifest;
 *   3. deletes the published paths of the same id range that the view no longer
 *      produces (a record that left the view; a merged record's path is
 *      replaced by a redirect page, #1766). The manifest is walked in step with
 *      the view, so no set of all the paths is ever held in memory.
 *
 * The manifest is written AFTER each successful upload or delete. A crash at
 * any point leaves it consistent with what is online: at worst a page is
 * uploaded again on the next run. Deleting a path that is already gone is not
 * an error, so a delete that succeeded before its manifest row was removed is
 * simply finished by the next run.
 *
 * Memory: one batch of rows, plus `concurrency` rendered pages at a time. When a
 * call fails, no new page is started and those in flight are finished first, so
 * the manifest matches the adapter when the call rejects.
 *
 * One run at a time: run() takes a session-level advisory lock on a leased
 * connection and rejects with code E_BOT_PAGES_RUNNING when another run holds
 * it. Two overlapping runs could otherwise break the invariant above: run A
 * reads a row as stale and deletes the blob, run B re-uploads it and upserts
 * the row, then A removes the row, and the page stays online with no manifest
 * entry, so no later run deletes it.
 *
 * Static extras published by the same run: 404.html (noindex).
 */

const crypto = require('crypto');
const botPagePaths = require('../../utils/botPagePaths');
const mapLimit = require('../../utils/mapLimit');
const BotRenderService = require('./BotRenderService');

const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_CONCURRENCY = 4;
const STATIC_TYPE = 'static';
const NOT_FOUND_PATH = '404.html';
const MAX_ID = 2147483647;
// Any key no other advisory lock uses (the search write lock uses 1871)
const LOCK_KEY = 1758;

const query = (sql, params) => CommonService.query(sql, params);

const sha256 = (html) =>
  crypto.createHash('sha256').update(html, 'utf8').digest('hex');

const readViewBatch = async (entityType, afterId, limit) => {
  const { rows } = await query(
    `SELECT entity_type, entity_id, language, lastmod, page
       FROM v_bot_page
      WHERE entity_type = $1 AND entity_id > $2
      ORDER BY entity_id
      LIMIT $3`,
    [entityType, afterId, limit]
  );
  return rows;
};

const manifestHashes = async (paths) => {
  if (paths.length === 0) return new Map();
  const { rows } = await query(
    'SELECT path, content_hash FROM t_bot_page_manifest WHERE path = ANY($1::text[])',
    [paths]
  );
  return new Map(rows.map((row) => [row.path, row.content_hash]));
};

const recordPublished = (page) =>
  query(
    `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash, lastmod, published_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (path) DO UPDATE
       SET entity_type = EXCLUDED.entity_type,
           entity_id = EXCLUDED.entity_id,
           content_hash = EXCLUDED.content_hash,
           lastmod = EXCLUDED.lastmod,
           published_at = EXCLUDED.published_at`,
    [page.path, page.entityType, page.entityId, page.hash, page.lastmod]
  );

const forgetPublished = (path) =>
  query('DELETE FROM t_bot_page_manifest WHERE path = $1', [path]);

// Runs `fn` holding the generator lock, or rejects at once when another run
// holds it. No transaction is held open while pages are uploaded.
const withRunLock = (fn) =>
  sails.getDatastore().leaseConnection(async (db) => {
    const {
      rows: [{ locked }],
    } = await CommonService.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [LOCK_KEY],
      db
    );
    if (!locked) {
      throw Object.assign(
        new Error('bot-page-generator: another run is in progress'),
        { code: 'E_BOT_PAGES_RUNNING' }
      );
    }
    try {
      return await fn();
    } finally {
      await CommonService.query(
        'SELECT pg_advisory_unlock($1)',
        [LOCK_KEY],
        db
      );
    }
  });

const assertPositiveInteger = (name, value) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(
      `BotPageGeneratorService.run needs a positive integer ${name}, got ${value}`
    );
  }
};

// The body of run(), under the lock: see the docblock at the top of the file
async function publish({
  adapter,
  concurrency,
  batchSize,
  baseUrl,
  readBatch = readViewBatch,
  onBatch = () => {},
  languageTags,
}) {
  const renderOptions = {
    ...(baseUrl ? { baseUrl } : {}),
    languageTags: languageTags || (await BotRenderService.loadLanguageTags()),
  };
  const summary = { uploaded: 0, unchanged: 0, deleted: 0, byType: {} };

  const publishIfChanged = async (page, known) => {
    if (known.get(page.path) === page.hash) {
      summary.unchanged += 1;
      return false;
    }
    await adapter.put(page.path, page.html);
    await recordPublished(page);
    summary.uploaded += 1;
    return true;
  };

  const remove = async (path) => {
    await adapter.delete(path);
    await forgetPublished(path);
    summary.deleted += 1;
  };

  // Paths of the manifest that `selectSql` picks, until none is left
  const removeAll = async (selectSql, params) => {
    for (;;) {
      // The next page can only be read once these are deleted
      // eslint-disable-next-line no-await-in-loop
      const { rows } = await query(selectSql, params);
      if (rows.length === 0) return;
      // eslint-disable-next-line no-await-in-loop
      await mapLimit(rows, concurrency, (row) => remove(row.path));
    }
  };

  const publishType = async (entityType) => {
    const stats = { uploaded: 0, unchanged: 0, deleted: 0 };
    let cursor = 0;
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const rows = await readBatch(entityType, cursor, batchSize);
      const isLast = rows.length < batchSize;
      const upper = isLast ? MAX_ID : rows[rows.length - 1].entity_id;
      const before = { ...summary };

      // eslint-disable-next-line no-await-in-loop
      const known = await manifestHashes(
        rows.map((row) => botPagePaths.toKey(entityType, row.entity_id))
      );
      // eslint-disable-next-line no-await-in-loop
      await mapLimit(rows, concurrency, async (row) => {
        const html = BotRenderService.render(row, renderOptions);
        await publishIfChanged(
          {
            path: botPagePaths.toKey(entityType, row.entity_id),
            entityType,
            entityId: row.entity_id,
            html,
            hash: sha256(html),
            lastmod: row.lastmod,
          },
          known
        );
      });

      // eslint-disable-next-line no-await-in-loop
      await removeAll(
        `SELECT path FROM t_bot_page_manifest
            WHERE entity_type = $1 AND entity_id > $2 AND entity_id <= $3
              AND NOT (entity_id = ANY($4::int[]))
            ORDER BY entity_id LIMIT $5`,
        [entityType, cursor, upper, rows.map((row) => row.entity_id), 1000]
      );

      stats.uploaded += summary.uploaded - before.uploaded;
      stats.unchanged += summary.unchanged - before.unchanged;
      stats.deleted += summary.deleted - before.deleted;
      // eslint-disable-next-line no-await-in-loop
      await onBatch({ entityType, cursor, rows: rows.length });
      if (isLast) break;
      cursor = upper;
    }
    summary.byType[entityType] = stats;
  };

  // Sequential: one type at a time, as the view is meant to be read
  // eslint-disable-next-line no-restricted-syntax
  for (const entityType of botPagePaths.ENTITY_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    await publishType(entityType);
  }

  // Static extras
  const notFound = BotRenderService.renderNotFound(renderOptions);
  const extras = [
    {
      path: NOT_FOUND_PATH,
      entityType: STATIC_TYPE,
      entityId: null,
      html: notFound,
      hash: sha256(notFound),
      lastmod: null,
    },
  ];
  const knownExtras = await manifestHashes(extras.map((e) => e.path));
  await mapLimit(extras, concurrency, (page) =>
    publishIfChanged(page, knownExtras)
  );
  await removeAll(
    `SELECT path FROM t_bot_page_manifest
        WHERE entity_type = $1 AND NOT (path = ANY($2::text[]))
        ORDER BY path LIMIT $3`,
    [STATIC_TYPE, extras.map((e) => e.path), 1000]
  );

  return summary;
}

module.exports = {
  /**
   * @param {object} options
   * @param {object} options.adapter storage adapter (put, delete, list)
   * @param {number} [options.concurrency] uploads and deletes in flight
   * @param {number} [options.batchSize] rows read from the view at a time
   * @param {string} [options.baseUrl] public base URL (default: the config key)
   * @param {Function} [options.readBatch] (entityType, afterId, limit) => rows;
   *   defaults to v_bot_page, replaceable for a synthetic source
   * @param {Function} [options.onBatch] called after each batch
   * @param {Map<string, string>} [options.languageTags] ISO 639-3 to 639-1;
   *   read from t_language when absent
   * @returns {Promise<{uploaded: number, unchanged: number, deleted: number,
   *   byType: object}>}
   * @throws an error with code E_BOT_PAGES_RUNNING when another run is in
   *   progress, before anything is read or published
   */
  async run(options) {
    const {
      adapter,
      concurrency = DEFAULT_CONCURRENCY,
      batchSize = DEFAULT_BATCH_SIZE,
    } = options;
    if (!adapter)
      throw new Error('BotPageGeneratorService.run needs an adapter');
    assertPositiveInteger('concurrency', concurrency);
    assertPositiveInteger('batchSize', batchSize);
    return withRunLock(() => publish({ ...options, concurrency, batchSize }));
  },

  NOT_FOUND_PATH,
  LOCK_KEY,
};
