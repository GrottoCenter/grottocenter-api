const isValidId = require('./isValidId');

const COUNTRY_PATTERN = /^[A-Za-z]{2}$/;
// Full ISO 3166-2 code: country, hyphen, 1 to 3 alphanumeric characters
const REGION_PATTERN = /^[A-Za-z]{2}-[A-Za-z0-9]{1,3}$/;
const ID_PATTERN = /^[0-9]+$/;

const readCode = (pattern) => (raw) =>
  typeof raw === 'string' && pattern.test(raw) ? raw.toUpperCase() : undefined;

const readId = (raw) => {
  if (typeof raw !== 'string' || !ID_PATTERN.test(raw)) return undefined;
  const id = Number(raw);
  return isValidId(id) ? id : undefined;
};

const FILTERS = [
  {
    name: 'countryId',
    read: readCode(COUNTRY_PATTERN),
    message: 'countryId must be an ISO 3166-1 alpha-2 country code (e.g. FR).',
  },
  {
    name: 'regionId',
    read: readCode(REGION_PATTERN),
    message: 'regionId must be a full ISO 3166-2 region code (e.g. FR-ARA).',
  },
  {
    name: 'massifId',
    read: readId,
    message: 'massifId must be a positive integer.',
  },
  {
    name: 'organizationId',
    read: readId,
    message: 'organizationId must be a positive integer.',
  },
];

/**
 * Read the optional filters of GET /api/v1/changes/recent.
 *
 * Absent parameters are left out of `filters`. Country and region codes are
 * upper-cased. The first invalid parameter (blank, repeated or malformed) is
 * returned as `error`, with the parameter name, its raw value and a message.
 *
 * @param {(name: string) => *} param reads a request parameter (req.param)
 * @returns {{ filters: { countryId?: string, regionId?: string,
 *   massifId?: number, organizationId?: number } }
 *   | { error: { field: string, value: *, message: string } }}
 */
const readRecentChangeFilters = (param) => {
  const filters = {};
  for (const { name, read, message } of FILTERS) {
    const raw = param(name);
    if (raw === undefined) continue; // eslint-disable-line no-continue
    const value = read(raw);
    if (value === undefined)
      return { error: { field: name, value: raw, message } };
    filters[name] = value;
  }
  return { filters };
};

module.exports = readRecentChangeFilters;
