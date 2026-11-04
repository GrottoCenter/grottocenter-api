/**
 * Where a bot page lives: (entityType, id) <-> blob key <-> public URL.
 *
 *   cave 123  ->  caves/123.html  ->  https://grottocenter.org/ui/caves/123
 *
 * The hub pages (#1935) are keyed by a string, not an id:
 *
 *   index          ->  countries.html                      ->  .../ui/countries
 *   country FR     ->  countries/FR.html                   ->  .../ui/countries/FR
 *   region FR-01   ->  countries/FR/regions/01.html        ->  .../ui/countries/FR/regions/01
 *
 * The hub key of the index is 'ALL'; of a region, the code of t_iso3166_2.
 *
 * The public URL is the SPA's own address: the same address serves the static
 * page to verified crawlers and the SPA to everyone else. There is no name
 * slug on purpose: a rename would leave a stale URL that needs a redirect.
 *
 * The generator, the sitemaps and the edge Worker all use this mapping.
 *
 * Pure: loads without Sails. The base URL is a parameter; the services pass
 * sails.config.custom.botSurface.publicBaseUrl.
 */

const DEFAULT_PUBLIC_BASE_URL = 'https://grottocenter.org/ui';

const DIRECTORY_BY_TYPE = Object.freeze({
  cave: 'caves',
  massif: 'massifs',
  organization: 'organizations',
});

const TYPE_BY_DIRECTORY = Object.freeze(
  Object.fromEntries(
    Object.entries(DIRECTORY_BY_TYPE).map(([type, dir]) => [dir, type])
  )
);

const ENTITY_TYPES = Object.freeze(Object.keys(DIRECTORY_BY_TYPE));

// Canonical decimal id: no sign, no leading zero, no exponent, fits a Postgres integer
const MAX_ID = 2147483647;
const ID_PATTERN = '[1-9][0-9]{0,9}';
const KEY_REGEXP = new RegExp(`^([a-z]+)/(${ID_PATTERN})\\.html$`);
const URL_PATH_REGEXP = new RegExp(`^([a-z]+)/(${ID_PATTERN})$`);

const HUB_TYPES = Object.freeze(['index', 'country', 'region']);
const INDEX_HUB_KEY = 'ALL';
const COUNTRY_CODE = '[A-Z]{2}';
const REGION_SUFFIX = '[A-Z0-9]{1,3}';
const HUB_KEY_PATTERNS = Object.freeze({
  index: new RegExp(`^${INDEX_HUB_KEY}$`),
  country: new RegExp(`^${COUNTRY_CODE}$`),
  region: new RegExp(`^${COUNTRY_CODE}-${REGION_SUFFIX}$`),
});
// The path of a hub below the public base URL (and, with `.html`, its blob key)
const HUB_PATH_REGEXPS = [
  ['index', /^countries$/],
  ['country', new RegExp(`^countries/(${COUNTRY_CODE})$`)],
  [
    'region',
    new RegExp(`^countries/(${COUNTRY_CODE})/regions/(${REGION_SUFFIX})$`),
  ],
];

const isValidId = (id) => Number.isInteger(id) && id >= 1 && id <= MAX_ID;

const directoryOf = (entityType) => {
  const directory = DIRECTORY_BY_TYPE[entityType];
  if (!Object.prototype.hasOwnProperty.call(DIRECTORY_BY_TYPE, entityType)) {
    throw new RangeError(`Unknown bot page entity type: ${entityType}`);
  }
  return directory;
};

const assertId = (id) => {
  if (!isValidId(id)) {
    throw new RangeError(`Invalid bot page entity id: ${id}`);
  }
};

const assertHub = (hubType, hubKey) => {
  if (
    !Object.prototype.hasOwnProperty.call(HUB_KEY_PATTERNS, hubType) ||
    typeof hubKey !== 'string' ||
    !HUB_KEY_PATTERNS[hubType].test(hubKey)
  ) {
    throw new RangeError(`Invalid bot hub: ${hubType} ${hubKey}`);
  }
};

// 'countries', 'countries/FR', 'countries/FR/regions/01'
const hubPath = (hubType, hubKey) => {
  assertHub(hubType, hubKey);
  if (hubType === 'index') return 'countries';
  if (hubType === 'country') return `countries/${hubKey}`;
  const [country, suffix] = hubKey.split('-');
  return `countries/${country}/regions/${suffix}`;
};

const parseHub = (path) => {
  if (typeof path !== 'string') return null;
  for (const [hubType, regexp] of HUB_PATH_REGEXPS) {
    const match = regexp.exec(path);
    if (match) {
      let hubKey = INDEX_HUB_KEY;
      if (hubType === 'country') [, hubKey] = match;
      if (hubType === 'region') hubKey = `${match[1]}-${match[2]}`;
      return { entityType: 'hub', hubType, hubKey };
    }
  }
  return null;
};

const normalizeBase = (baseUrl) => baseUrl.replace(/\/+$/, '');

/** `caves/123.html`. Throws a RangeError on an unknown type or an invalid id. */
const toKey = (entityType, id) => {
  const directory = directoryOf(entityType);
  assertId(id);
  return `${directory}/${id}.html`;
};

/** `countries/FR.html`. Throws a RangeError on an invalid hub. */
const toHubKey = (hubType, hubKey) => `${hubPath(hubType, hubKey)}.html`;

/** `https://grottocenter.org/ui/countries/FR`. */
const toHubUrl = (hubType, hubKey, baseUrl = DEFAULT_PUBLIC_BASE_URL) =>
  `${normalizeBase(baseUrl)}/${hubPath(hubType, hubKey)}`;

/** `https://grottocenter.org/ui/caves/123`. */
const toUrl = (entityType, id, baseUrl = DEFAULT_PUBLIC_BASE_URL) => {
  const directory = directoryOf(entityType);
  assertId(id);
  return `${normalizeBase(baseUrl)}/${directory}/${id}`;
};

const parse = (regexp, value) => {
  if (typeof value !== 'string') return null;
  const match = regexp.exec(value);
  if (!match) return null;
  const [, directory, rawId] = match;
  const id = Number(rawId);
  if (
    !Object.prototype.hasOwnProperty.call(TYPE_BY_DIRECTORY, directory) ||
    !isValidId(id)
  ) {
    return null;
  }
  return { entityType: TYPE_BY_DIRECTORY[directory], id };
};

/**
 * `caves/123.html` -> `{ entityType: 'cave', id: 123 }`;
 * `countries/FR.html` -> `{ entityType: 'hub', hubType: 'country', hubKey: 'FR' }`.
 * Null when it is not a page key.
 */
const fromKey = (key) => {
  if (typeof key === 'string' && key.endsWith('.html')) {
    const hub = parseHub(key.slice(0, -'.html'.length));
    if (hub) return hub;
  }
  return parse(KEY_REGEXP, key);
};

/**
 * `https://grottocenter.org/ui/caves/123` -> `{ entityType: 'cave', id: 123 }`.
 * Null for any other address, including one with a query string, a fragment or
 * a trailing slash: only the canonical URL maps back.
 */
const fromUrl = (url, baseUrl = DEFAULT_PUBLIC_BASE_URL) => {
  if (typeof url !== 'string') return null;
  const prefix = `${normalizeBase(baseUrl)}/`;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return parseHub(path) || parse(URL_PATH_REGEXP, path);
};

module.exports = {
  DEFAULT_PUBLIC_BASE_URL,
  ENTITY_TYPES,
  HUB_TYPES,
  INDEX_HUB_KEY,
  toKey,
  toUrl,
  toHubKey,
  toHubUrl,
  fromKey,
  fromUrl,
};
