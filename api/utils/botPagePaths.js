/**
 * Where a bot page lives: (entityType, id) <-> blob key <-> public URL.
 *
 *   cave 123  ->  caves/123.html  ->  https://grottocenter.org/ui/caves/123
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

const normalizeBase = (baseUrl) => baseUrl.replace(/\/+$/, '');

/** `caves/123.html`. Throws a RangeError on an unknown type or an invalid id. */
const toKey = (entityType, id) => {
  const directory = directoryOf(entityType);
  assertId(id);
  return `${directory}/${id}.html`;
};

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

/** `caves/123.html` -> `{ entityType: 'cave', id: 123 }`, or null when it is not a page key. */
const fromKey = (key) => parse(KEY_REGEXP, key);

/**
 * `https://grottocenter.org/ui/caves/123` -> `{ entityType: 'cave', id: 123 }`.
 * Null for any other address, including one with a query string, a fragment or
 * a trailing slash: only the canonical URL maps back.
 */
const fromUrl = (url, baseUrl = DEFAULT_PUBLIC_BASE_URL) => {
  if (typeof url !== 'string') return null;
  const prefix = `${normalizeBase(baseUrl)}/`;
  if (!url.startsWith(prefix)) return null;
  return parse(URL_PATH_REGEXP, url.slice(prefix.length));
};

module.exports = {
  DEFAULT_PUBLIC_BASE_URL,
  ENTITY_TYPES,
  toKey,
  toUrl,
  fromKey,
  fromUrl,
};
