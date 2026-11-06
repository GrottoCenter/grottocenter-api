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
 *   3. publishes, for the same id range, the redirect pages of v_bot_redirect:
 *      a merged record's old path holds a small page that points to the final
 *      target of its merge chain, with the target in the blob metadata
 *      `redirectto`. A redirect is a manifest row like a page (same type, the
 *      old record's id) with `redirect_to` set to the target id, which is what
 *      tells it from a content page (sitemaps list only the rows where it is
 *      NULL), so it is uploaded when its hash changes and deleted
 *      when the redirect is no longer produced (the target left the view, the
 *      record was restored). The redirects of one type are read once, before
 *      its pages: they are the merged records, a few thousand rows of two
 *      integers, and v_bot_redirect is not meant to be read per batch;
 *   4. deletes the published paths of the same id range that neither the view
 *      nor v_bot_redirect produces (a record that left the view). The manifest
 *      is walked in step with the view, so no set of all the paths is ever held
 *      in memory.
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
 * Hubs (#1935): before anything else the run reads v_bot_hub once (about 870
 * rows at most, BotHubService.loadHubs). Those rows decide which hubs the
 * breadcrumbs and lists link to AND which hubs are published, after the
 * records, with the SPA's figures. A manifest hub path the run does not
 * produce is deleted (the hub stopped being published). Hub rows are manifest
 * rows of entity_type 'hub', with hub_type and hub_key and no entity_id.
 *
 * Static extras published by the same run: 404.html (noindex). The sitemap
 * files (sitemap.xml, sitemap-*.xml.gz) are static rows of the manifest too, written
 * by BotSitemapService (step 5, after this one): this run never deletes them.
 *
 * Redirects (#1766) and the "manifest after each upload" rule: a redirect page
 * is put with its `redirectto` metadata, then its manifest row is written,
 * exactly as for a page.
 */

const botPagePaths = require('../../utils/botPagePaths');
const mapLimit = require('../../utils/mapLimit');
const BotRenderService = require('./BotRenderService');
const BotHubService = require('./BotHubService');
const BotPublishService = require('./BotPublishService');
const botSitemap = require('../../utils/botSitemap');

const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_CONCURRENCY = 4;
const STATIC_TYPE = 'static';
const HUB_TYPE = 'hub';
const NOT_FOUND_PATH = '404.html';
const MAX_ID = 2147483647;
// Any key no other advisory lock uses (the search write lock uses 1871)
const LOCK_KEY = 1758;

const query = (sql, params) => CommonService.query(sql, params);

const readRedirectRows = async (entityType) => {
  const { rows } = await query(
    `SELECT entity_id, target_id
       FROM v_bot_redirect
      WHERE entity_type = $1
      ORDER BY entity_id`,
    [entityType]
  );
  return rows;
};

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

const { sha256, manifestHashes, forgetPublished } = BotPublishService;

// Runs `fn` holding the generator lock, or rejects at once when another run
// holds it. No transaction is held open while pages are uploaded. The sitemaps
// (BotSitemapService) take the same lock: they read the manifest this run
// writes.
const withRunLock = (fn, name = 'bot-page-generator') =>
  sails.getDatastore().leaseConnection(async (db) => {
    const {
      rows: [{ locked }],
    } = await CommonService.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [LOCK_KEY],
      db
    );
    if (!locked) {
      throw Object.assign(new Error(`${name}: another run is in progress`), {
        code: 'E_BOT_PAGES_RUNNING',
      });
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
  readRedirects = readRedirectRows,
  onBatch = () => {},
  languageTags,
  countryNames,
  readHubs,
}) {
  // The published hubs, read once before any page is rendered: the same rows
  // give the links of every page and the hubs this run publishes
  const hubs = await BotHubService.loadHubs(
    readHubs ? { readAll: readHubs } : {}
  );
  const resolvedBaseUrl = BotPublishService.resolveBaseUrl(baseUrl);
  const renderOptions = await BotPublishService.loadRenderOptions({
    baseUrl: resolvedBaseUrl,
    languageTags,
    countryNames,
    hubLinks: BotHubService.createHubLinks(hubs, resolvedBaseUrl),
  });
  const summary = { uploaded: 0, unchanged: 0, deleted: 0, byType: {} };

  const publishIfChanged = async (page, known) => {
    const uploaded = await BotPublishService.publishIfChanged(
      adapter,
      page,
      known.get(page.path)
    );
    summary[uploaded ? 'uploaded' : 'unchanged'] += 1;
    return uploaded;
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
    const redirects = await readRedirects(entityType);
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const rows = await readBatch(entityType, cursor, batchSize);
      const isLast = rows.length < batchSize;
      const upper = isLast ? MAX_ID : rows[rows.length - 1].entity_id;
      const before = { ...summary };

      // The redirects of this id range, minus an id the view also holds (the
      // page wins; the two views do not overlap, but they are read apart)
      const after = cursor;
      const pageIds = new Set(rows.map((row) => row.entity_id));
      const batchRedirects = redirects.filter(
        (r) =>
          r.entity_id > after &&
          r.entity_id <= upper &&
          !pageIds.has(r.entity_id)
      );

      // eslint-disable-next-line no-await-in-loop
      const known = await manifestHashes([
        ...rows.map((row) => botPagePaths.toKey(entityType, row.entity_id)),
        ...batchRedirects.map((r) =>
          botPagePaths.toKey(entityType, r.entity_id)
        ),
      ]);
      // A massif page shows the SPA's figures and its regions (#1935)
      const batchOptions =
        entityType === 'massif'
          ? {
              ...renderOptions,
              // eslint-disable-next-line no-await-in-loop
              massifExtras: await BotHubService.massifExtras(
                rows.map((row) => row.entity_id),
                hubs,
                { concurrency }
              ),
            }
          : renderOptions;
      // eslint-disable-next-line no-await-in-loop
      await mapLimit(rows, concurrency, (row) =>
        publishIfChanged(
          BotPublishService.pagePublication(row, batchOptions),
          known
        )
      );

      // eslint-disable-next-line no-await-in-loop
      await mapLimit(batchRedirects, concurrency, (redirect) =>
        publishIfChanged(
          BotPublishService.redirectPublication(
            entityType,
            redirect.entity_id,
            redirect.target_id,
            renderOptions
          ),
          known
        )
      );

      // eslint-disable-next-line no-await-in-loop
      await removeAll(
        `SELECT path FROM t_bot_page_manifest
            WHERE entity_type = $1 AND entity_id > $2 AND entity_id <= $3
              AND NOT (entity_id = ANY($4::int[]))
            ORDER BY entity_id LIMIT $5`,
        [
          entityType,
          cursor,
          upper,
          [...pageIds, ...batchRedirects.map((r) => r.entity_id)],
          1000,
        ]
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

  // The hubs: rendered from the rows read at the start, with the SPA's figures.
  // A hub that is no longer published has no row, so its path is among the
  // manifest's hub paths that this run does not produce, and is deleted. The
  // hubs are few (about 870), so the manifest's hub rows are selected in one
  // query, not walked by range.
  const publishHubs = async () => {
    const stats = { uploaded: 0, unchanged: 0, deleted: 0 };
    const before = { ...summary };
    const hubFigures = await BotHubService.loadFigures(hubs, { concurrency });
    const pages = hubs.rows.map((row) => ({
      row,
      path: botPagePaths.toHubKey(row.hub_type, row.hub_key),
    }));
    const known = await manifestHashes(pages.map((page) => page.path));
    await mapLimit(pages, concurrency, async ({ row, path }) => {
      const html = BotRenderService.renderHub(row, {
        ...renderOptions,
        hubFigures,
      });
      await publishIfChanged(
        {
          path,
          entityType: HUB_TYPE,
          entityId: null,
          hubType: row.hub_type,
          hubKey: row.hub_key,
          html,
          hash: sha256(html),
          lastmod: row.lastmod,
          lastmodAtUpload: true,
        },
        known
      );
    });
    await removeAll(
      `SELECT path FROM t_bot_page_manifest
          WHERE entity_type = $1 AND NOT (path = ANY($2::text[]))
          ORDER BY path LIMIT $3`,
      [HUB_TYPE, pages.map((page) => page.path), 1000]
    );
    stats.uploaded = summary.uploaded - before.uploaded;
    stats.unchanged = summary.unchanged - before.unchanged;
    stats.deleted = summary.deleted - before.deleted;
    summary.byType[HUB_TYPE] = stats;
  };

  // Sequential: one type at a time, as the view is meant to be read
  // eslint-disable-next-line no-restricted-syntax
  for (const entityType of botPagePaths.ENTITY_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    await publishType(entityType);
  }

  await publishHubs();

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
  // The sitemap files are static rows too, owned by BotSitemapService: never
  // removed here
  await removeAll(
    `SELECT path FROM t_bot_page_manifest
        WHERE entity_type = $1 AND NOT (path = ANY($2::text[]))
          AND path <> $3 AND path NOT LIKE $4
        ORDER BY path LIMIT $5`,
    [
      STATIC_TYPE,
      extras.map((e) => e.path),
      botSitemap.INDEX_PATH,
      botSitemap.SHARD_PATH_PATTERN,
      1000,
    ]
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
   * @param {Function} [options.readRedirects] (entityType) => rows of
   *   {entity_id, target_id}, sorted by entity_id; defaults to v_bot_redirect
   * @param {Function} [options.readHubs] () => every row of v_bot_hub;
   *   defaults to one read of v_bot_hub, replaceable for a synthetic source
   * @param {Function} [options.onBatch] called after each batch
   * @param {Map<string, string>} [options.languageTags] ISO 639-3 to 639-1;
   *   read from t_language when absent
   * @param {Map<string, string>} [options.countryNames] t_country.native_name by
   *   ISO code; read from t_country when absent
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
  withRunLock,
};
