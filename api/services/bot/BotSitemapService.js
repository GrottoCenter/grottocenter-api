/**
 * BotSitemapService.js
 *
 * @description :: Step 5 of the nightly bot-surface pipeline (#1767), run
 *   after the page generator (step 4). Publishes the sitemaps of what is
 *   online, read from t_bot_page_manifest and never from the views, through
 *   the same storage adapter:
 *
 *   sitemap.xml                         the index, one <sitemap> per shard,
 *                                       <lastmod> = when that shard last changed
 *   sitemap-<plural>-<k>.xml.gz         the records of one type with an id in
 *                                       [k*50000, (k+1)*50000) (botSitemap.shardKey)
 *   sitemap-hubs.xml.gz                 every hub, by hub type then key
 *
 * All at the root of the site (see botSitemap.js for why).
 *
 * Listed: the manifest rows of a content page, redirect_to IS NULL, of the
 * types asked for. Left out: redirect pages (noindex) and the static extras
 * (404.html, and the sitemap files themselves). Each URL has a <loc> (the
 * page's address from botPagePaths) and the manifest's lastmod as <lastmod>,
 * written with the microseconds Postgres holds, in UTC.
 *
 * Change detection: each file's XML (before gzip, whose bytes may change with
 * the zlib version) is hashed (sha256) and the hash kept in the manifest as a
 * static row of that path. A file whose hash did not change is not uploaded
 * again.
 *
 * The <lastmod> of a shard in the index is when the FILE last changed, kept in
 * the manifest row of the shard: the time of the run that uploaded it, and the
 * stored value while its hash is unchanged. Never an entry's date, which could
 * lie in the future and make the shard's date go back later.
 * The latest lastmod of its entries would miss a URL leaving the shard (the
 * file changes, the date does not, or goes back), and crawlers reading the
 * index would not fetch the shard again. An unchanged night keeps every date,
 * so the index is unchanged too.
 *
 * Order, so a crawler never reads an index that names a missing shard: the
 * shards are uploaded first, then the index, then the shards that are no
 * longer produced (a range or a type that became empty) are deleted. When no
 * shard is left at all, the index is deleted first (an empty index is not
 * valid). The manifest row of a file is written after its upload and removed
 * after its delete, as for the pages.
 *
 * Memory: the manifest of one type is read by keyset; at most one shard
 * (50,000 URLs) is held at a time, plus the list of shards for the index.
 *
 * Lock: run() takes the page generator's advisory lock (BotPageGeneratorService
 * LOCK_KEY) and rejects with E_BOT_PAGES_RUNNING while a generation run holds
 * it, so a sitemap never reads a manifest that is being written.
 */

const crypto = require('crypto');
const util = require('util');
const zlib = require('zlib');
const botPagePaths = require('../../utils/botPagePaths');
const botSitemap = require('../../utils/botSitemap');
const BotPageGeneratorService = require('./BotPageGeneratorService');

const gzip = util.promisify(zlib.gzip);

const HUB_TYPE = 'hub';
const STATIC_TYPE = 'static';
const SITEMAP_TYPES = Object.freeze([...botPagePaths.ENTITY_TYPES, HUB_TYPE]);
const DEFAULT_BATCH_SIZE = 5000;
const INDEX_CONTENT_TYPE = 'application/xml; charset=utf-8';
const SHARD_CONTENT_TYPE = 'application/gzip';

// The manifest's lastmod as a W3C datetime, exact to the microsecond. One
// fixed format, so the strings sort like the instants they name
const lastmodSql = (expression) =>
  `to_char(${expression} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const LASTMOD_SQL = lastmodSql('lastmod');

const query = (sql, params) => CommonService.query(sql, params);

const sha256 = (text) =>
  crypto.createHash('sha256').update(text, 'utf8').digest('hex');

const latest = (lastmods) =>
  lastmods.reduce(
    (max, lastmod) => (lastmod && lastmod > max ? lastmod : max),
    ''
  ) || null;

const readRecordBatch = async (entityType, afterId, limit) => {
  const { rows } = await query(
    `SELECT entity_id, ${LASTMOD_SQL} AS lastmod
       FROM t_bot_page_manifest
      WHERE entity_type = $1 AND redirect_to IS NULL AND entity_id > $2
      ORDER BY entity_id
      LIMIT $3`,
    [entityType, afterId, limit]
  );
  return rows;
};

// About 870 rows at most, read at once
const readHubRows = async () => {
  const { rows } = await query(
    `SELECT hub_type, hub_key, ${LASTMOD_SQL} AS lastmod
       FROM t_bot_page_manifest
      WHERE entity_type = $1 AND redirect_to IS NULL
      ORDER BY array_position($2::text[], hub_type::text), hub_key COLLATE "C"`,
    [HUB_TYPE, botPagePaths.HUB_TYPES]
  );
  return rows;
};

// path -> { hash, lastmod } of the sitemap files already published
const readPublishedFiles = async () => {
  const { rows } = await query(
    `SELECT path, content_hash, ${LASTMOD_SQL} AS lastmod
       FROM t_bot_page_manifest
      WHERE entity_type = $1 AND (path = $2 OR path LIKE $3)`,
    [STATIC_TYPE, botSitemap.INDEX_PATH, botSitemap.SHARD_PATH_PATTERN]
  );
  return new Map(
    rows.map((row) => [
      row.path,
      { hash: row.content_hash, lastmod: row.lastmod },
    ])
  );
};

// The time of this run, in the format of LASTMOD_SQL, so a shard's date
// compares as a string with the stored dates of the other shards (index lastmod)
const readNow = async () => {
  const {
    rows: [{ now }],
  } = await query(`SELECT ${lastmodSql('now()')} AS now`);
  return now;
};

const recordPublished = ({ path, hash, lastmod }) =>
  query(
    `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, content_hash, lastmod, published_at)
     VALUES ($1, $2, NULL, $3, $4, now())
     ON CONFLICT (path) DO UPDATE
       SET entity_type = EXCLUDED.entity_type,
           entity_id = NULL,
           hub_type = NULL,
           hub_key = NULL,
           redirect_to = NULL,
           content_hash = EXCLUDED.content_hash,
           lastmod = EXCLUDED.lastmod,
           published_at = EXCLUDED.published_at`,
    [path, STATIC_TYPE, hash, lastmod]
  );

const forgetPublished = (path) =>
  query('DELETE FROM t_bot_page_manifest WHERE path = $1', [path]);

const assertOptions = ({ entityTypes, batchSize }) => {
  if (!Array.isArray(entityTypes)) {
    throw new TypeError('BotSitemapService.run needs an array of entityTypes');
  }
  entityTypes.forEach((type) => {
    if (!SITEMAP_TYPES.includes(type)) {
      throw new RangeError(`Unknown bot sitemap entity type: ${type}`);
    }
  });
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new RangeError(
      `BotSitemapService.run needs a positive integer batchSize, got ${batchSize}`
    );
  }
};

async function publish({ adapter, baseUrl, siteUrl, entityTypes, batchSize }) {
  const pageBase = baseUrl || sails.config.custom.botSurface.publicBaseUrl;
  const fileBase = (siteUrl || botSitemap.siteOrigin(pageBase)).replace(
    /\/+$/,
    ''
  );
  const known = await readPublishedFiles();
  const runAt = await readNow();
  const summary = {
    uploaded: 0,
    unchanged: 0,
    deleted: 0,
    shards: 0,
    urls: 0,
  };
  // The shards of this run, in order, for the index: { path, lastmod }
  const shards = [];

  // Returns the lastmod of the file: the stored one when it is unchanged, the
  // one given (the run's time for a shard) when it is uploaded
  const publishFile = async (path, xml, lastmod, contentType) => {
    const hash = sha256(xml);
    const previous = known.get(path);
    if (previous && previous.hash === hash) {
      summary.unchanged += 1;
      return previous.lastmod;
    }
    const body =
      contentType === SHARD_CONTENT_TYPE
        ? await gzip(Buffer.from(xml, 'utf8'))
        : xml;
    await adapter.put(path, body, { contentType });
    await recordPublished({ path, hash, lastmod });
    summary.uploaded += 1;
    return lastmod;
  };

  const publishShard = async (path, entries) => {
    if (entries.length > botSitemap.SHARD_SIZE) {
      throw new RangeError(
        `bot sitemap ${path} would hold ${entries.length} URLs, over ${botSitemap.SHARD_SIZE}`
      );
    }
    // When it changes now: the time of this run, and nothing else. A date
    // taken from an entry could lie in the future (a future-dated manifest
    // row), and the shard's date would then go back once that entry left it
    const lastmod = await publishFile(
      path,
      botSitemap.urlsetXml(entries),
      runAt,
      SHARD_CONTENT_TYPE
    );
    shards.push({ path, lastmod });
    summary.shards += 1;
    summary.urls += entries.length;
  };

  const publishType = async (entityType) => {
    let cursor = 0;
    let shard = null;
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const rows = await readRecordBatch(entityType, cursor, batchSize);
      // eslint-disable-next-line no-restricted-syntax
      for (const row of rows) {
        const k = botSitemap.shardKey(entityType, row.entity_id);
        if (shard && shard.k !== k) {
          // eslint-disable-next-line no-await-in-loop
          await publishShard(
            botSitemap.shardPath(entityType, shard.k),
            shard.entries
          );
          shard = null;
        }
        if (!shard) shard = { k, entries: [] };
        shard.entries.push({
          loc: botPagePaths.toUrl(entityType, row.entity_id, pageBase),
          lastmod: row.lastmod,
        });
      }
      if (rows.length < batchSize) break;
      cursor = rows[rows.length - 1].entity_id;
    }
    if (shard) {
      await publishShard(
        botSitemap.shardPath(entityType, shard.k),
        shard.entries
      );
    }
  };

  const publishHubs = async () => {
    const rows = await readHubRows();
    if (rows.length === 0) return;
    await publishShard(
      botSitemap.HUB_SHARD_PATH,
      rows.map((row) => ({
        loc: botPagePaths.toHubUrl(row.hub_type, row.hub_key, pageBase),
        lastmod: row.lastmod,
      }))
    );
  };

  // Sequential, in a fixed order, so the index lists the shards the same way
  // every run
  // eslint-disable-next-line no-restricted-syntax
  for (const entityType of botPagePaths.ENTITY_TYPES) {
    // eslint-disable-next-line no-await-in-loop
    if (entityTypes.includes(entityType)) await publishType(entityType);
  }
  if (entityTypes.includes(HUB_TYPE)) await publishHubs();

  const produced = new Set(shards.map((shard) => shard.path));
  if (shards.length > 0) {
    await publishFile(
      botSitemap.INDEX_PATH,
      botSitemap.sitemapIndexXml(
        shards.map((shard) => ({
          loc: `${fileBase}/${shard.path}`,
          lastmod: shard.lastmod,
        }))
      ),
      latest(shards.map((shard) => shard.lastmod)),
      INDEX_CONTENT_TYPE
    );
    produced.add(botSitemap.INDEX_PATH);
  }

  // The index first when it goes too, then the shards nobody lists any more
  const stale = [...known.keys()]
    .filter((path) => !produced.has(path))
    .sort((a, b) => {
      if (a === botSitemap.INDEX_PATH) return -1;
      if (b === botSitemap.INDEX_PATH) return 1;
      return a < b ? -1 : 1;
    });
  // eslint-disable-next-line no-restricted-syntax
  for (const path of stale) {
    // eslint-disable-next-line no-await-in-loop
    await adapter.delete(path);
    // eslint-disable-next-line no-await-in-loop
    await forgetPublished(path);
    summary.deleted += 1;
  }

  return summary;
}

module.exports = {
  /**
   * @param {object} options
   * @param {object} options.adapter storage adapter (put, delete, list)
   * @param {string[]} [options.entityTypes] the types listed, among cave,
   *   massif, organization and hub. Default: all of them. A type left out has
   *   no shard, so its shards already published are deleted. The nightly
   *   pipeline passes BOT_SURFACE_ENTITY_TYPES (#1888) here.
   * @param {string} [options.baseUrl] public base URL of the pages (default:
   *   sails.config.custom.botSurface.publicBaseUrl)
   * @param {string} [options.siteUrl] where the sitemap files are served
   *   (default: the origin of baseUrl, so https://grottocenter.org/sitemap.xml)
   * @param {number} [options.batchSize] manifest rows read at a time
   * @returns {Promise<{uploaded: number, unchanged: number, deleted: number,
   *   shards: number, urls: number}>}
   * @throws an error with code E_BOT_PAGES_RUNNING while a generation run (or
   *   another sitemap run) holds the lock, before anything is read
   */
  async run(options = {}) {
    const {
      adapter,
      entityTypes = SITEMAP_TYPES,
      batchSize = DEFAULT_BATCH_SIZE,
    } = options;
    if (!adapter) throw new Error('BotSitemapService.run needs an adapter');
    assertOptions({ entityTypes, batchSize });
    return BotPageGeneratorService.withRunLock(
      () => publish({ ...options, entityTypes, batchSize }),
      'bot-sitemaps'
    );
  },

  SITEMAP_TYPES,
  INDEX_CONTENT_TYPE,
  SHARD_CONTENT_TYPE,
};
