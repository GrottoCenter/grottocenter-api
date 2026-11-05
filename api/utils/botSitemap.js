/**
 * The sitemap files of the bot surface (#1767): their names, their shards and
 * their XML. Pure: loads without Sails.
 *
 *   sitemap.xml                       the index, one <sitemap> per shard
 *   sitemap-caves-<k>.xml.gz          the caves with an id in [k*50000, (k+1)*50000)
 *   sitemap-massifs-<k>.xml.gz        the same for the massifs
 *   sitemap-organizations-<k>.xml.gz
 *   sitemap-hubs.xml.gz               every hub (at most about 870), by hub type
 *                                     (index, country, region), then by key
 *
 * Every file sits at the root of the site, next to sitemap.xml: the protocol
 * scopes a sitemap to the URLs under its own directory, and the pages are
 * under /ui/, so a file under /sitemaps/ could not list them for a strict
 * crawler. A file at the root can list any URL of the host.
 *
 * A record shard is a fixed id range, so it never holds more than the
 * protocol's 50,000 URLs and a page never moves to another shard as others are
 * added. Only <loc> and <lastmod> are written: no <changefreq>, no <priority>.
 */

const botPagePaths = require('./botPagePaths');

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
// The protocol's limit of URLs per file, and the width of an id range
const SHARD_SIZE = 50000;
const INDEX_PATH = 'sitemap.xml';
const SHARD_PREFIX = 'sitemap-';
const SHARD_SUFFIX = '.xml.gz';
const HUB_SHARD_PATH = `${SHARD_PREFIX}hubs${SHARD_SUFFIX}`;
// The manifest paths of the shards, as a LIKE pattern: none of the pages has
// a path at the root that starts with "sitemap-"
const SHARD_PATH_PATTERN = `${SHARD_PREFIX}%${SHARD_SUFFIX}`;
const MAX_ID = 2147483647;

const XML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);

const assertType = (entityType) => {
  if (
    !Object.prototype.hasOwnProperty.call(
      botPagePaths.DIRECTORY_BY_TYPE,
      entityType
    )
  ) {
    throw new RangeError(`Unknown bot sitemap entity type: ${entityType}`);
  }
};

/**
 * The shard of a record: k such that k*50000 <= id < (k+1)*50000. The type is
 * validated but does not move the range: each type has its own files.
 * Throws a RangeError on an unknown type or an id that is not a page id.
 */
const shardKey = (entityType, id) => {
  assertType(entityType);
  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) {
    throw new RangeError(`Invalid bot sitemap entity id: ${id}`);
  }
  return Math.floor(id / SHARD_SIZE);
};

/** `sitemap-caves-0.xml.gz`. */
const shardPath = (entityType, k) => {
  assertType(entityType);
  if (!Number.isInteger(k) || k < 0) {
    throw new RangeError(`Invalid bot sitemap shard: ${k}`);
  }
  return `${SHARD_PREFIX}${botPagePaths.DIRECTORY_BY_TYPE[entityType]}-${k}${SHARD_SUFFIX}`;
};

const entryXml = (element, { loc, lastmod }) =>
  `<${element}><loc>${escapeXml(loc)}</loc>${
    lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''
  }</${element}>\n`;

const document = (root, element, entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="${SITEMAP_NAMESPACE}">\n${entries
    .map((entry) => entryXml(element, entry))
    .join('')}</${root}>\n`;

/** A <urlset> of `{ loc, lastmod }` (lastmod a W3C datetime, or omitted). */
const urlsetXml = (entries) => document('urlset', 'url', entries);

/** A <sitemapindex> of `{ loc, lastmod }`. */
const sitemapIndexXml = (entries) =>
  document('sitemapindex', 'sitemap', entries);

/**
 * Where the sitemap files are served: the origin of the public base URL
 * (`https://grottocenter.org/ui` -> `https://grottocenter.org`), so the index
 * is `https://grottocenter.org/sitemap.xml`.
 */
const siteOrigin = (publicBaseUrl) => new URL(publicBaseUrl).origin;

module.exports = {
  SITEMAP_NAMESPACE,
  SHARD_SIZE,
  INDEX_PATH,
  SHARD_PATH_PATTERN,
  HUB_SHARD_PATH,
  shardKey,
  shardPath,
  urlsetXml,
  sitemapIndexXml,
  siteOrigin,
};
