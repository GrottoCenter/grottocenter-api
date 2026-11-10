/**
 * botSurfaceConfig.js
 *
 * @description :: Reads and validates the environment settings of the bot
 *   surface (docs/bot-surface.md): the allow-list of entity types
 *   (BOT_SURFACE_ENTITY_TYPES, #1888) and the schedule of the nightly pipeline
 *   (BOT_SURFACE_SCHEDULE, #1760). Pure: loads without Sails, so
 *   config/custom.js can call it at startup and fail with a clear message.
 */

const botPagePaths = require('./botPagePaths');

// What can be listed: the three page types and the hub pages
const HUB_TYPE = 'hub';
const ENTITY_TYPES = Object.freeze([...botPagePaths.ENTITY_TYPES, HUB_TYPE]);

// 01:30 UTC. PROVISIONAL: the real time is chosen from the traffic
// measurements. Clear of pg_cron (04:20 daily; 04:30 bot outbox trim; 04:40,
// 04:45 and 04:50 every 3 days) and of the DB export (Sundays 03:00)
const DEFAULT_SCHEDULE = '30 1 * * *';

/**
 * @param {?string} value comma-separated names, e.g. "organization,massif"
 * @returns {string[]} the distinct names, in the order of ENTITY_TYPES.
 *   Empty for an unset or blank value: nothing is generated.
 * @throws {Error} naming the unknown entries and the accepted ones
 */
const parseEntityTypes = (value) => {
  const names = String(value ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== '');
  const unknown = names.filter((name) => !ENTITY_TYPES.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `BOT_SURFACE_ENTITY_TYPES: unknown type(s) ${unknown
        .map((name) => `"${name}"`)
        .join(', ')}. Accepted: ${ENTITY_TYPES.join(', ')} (comma-separated)`
    );
  }
  return ENTITY_TYPES.filter((type) => names.includes(type));
};

// minute hour day-of-month month day-of-week
const FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day of week', min: 0, max: 7 },
];

const isInt = (text) => /^\d+$/.test(text);

const validateField = (text, { name, min, max }) => {
  text.split(',').forEach((part) => {
    const [range, step, ...extra] = part.split('/');
    const stepOk = step === undefined || (isInt(step) && Number(step) > 0);
    const bounds = range === '*' ? [] : range.split('-');
    const boundsOk =
      bounds.length <= 2 &&
      bounds.every((bound) => isInt(bound) && bound >= min && bound <= max) &&
      (bounds.length < 2 || Number(bounds[0]) <= Number(bounds[1]));
    if (extra.length > 0 || !stepOk || (range !== '*' && !boundsOk)) {
      throw new Error(
        `BOT_SURFACE_SCHEDULE: invalid ${name} field "${text}" (allowed ${min}-${max})`
      );
    }
  });
};

/**
 * @param {?string} value a five-field cron expression, read in UTC. Unset or
 *   blank gives DEFAULT_SCHEDULE.
 * @returns {string} the expression, single-spaced
 * @throws {Error} when it is not five valid fields
 */
const parseSchedule = (value) => {
  const text = String(value ?? '').trim();
  if (text === '') return DEFAULT_SCHEDULE;
  const fields = text.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(
      `BOT_SURFACE_SCHEDULE: expected 5 cron fields (minute hour day-of-month month day-of-week), got ${fields.length} in "${text}"`
    );
  }
  fields.forEach((field, i) => validateField(field, FIELDS[i]));
  return fields.join(' ');
};

// The nightly audit (#1887)
const AUDIT_DEFAULTS = Object.freeze({
  sampleSize: 1000,
  failureLimit: 10,
  variantSample: 20,
  timeBudgetMs: 30 * 60 * 1000,
});
const AUDIT_MAX_SAMPLE_SIZE = 100000;
const AUDIT_MAX_VARIANT_SAMPLE = 1000;

// An unset or blank value gives the default; anything but plain digits within
// [min, max] stops the startup with the name of the variable
const parseBoundedInteger = (name, value, fallback, min, max) => {
  const text = String(value ?? '').trim();
  if (text === '') return fallback;
  const number = Number(text);
  if (!/^\d+$/.test(text) || number < min || number > max) {
    throw new Error(
      `${name}: expected an integer from ${min} to ${max}, got "${text}"`
    );
  }
  return number;
};

/** BOT_AUDIT_SAMPLE_SIZE: pages checked besides tonight's uploads. Default 1000, 0 to 100000. */
const parseAuditSampleSize = (value) =>
  parseBoundedInteger(
    'BOT_AUDIT_SAMPLE_SIZE',
    value,
    AUDIT_DEFAULTS.sampleSize,
    0,
    AUDIT_MAX_SAMPLE_SIZE
  );

/** BOT_AUDIT_FAILURE_LIMIT: failures one run tolerates before publishing stops. Default 10, 0 or more. */
const parseAuditFailureLimit = (value) =>
  parseBoundedInteger(
    'BOT_AUDIT_FAILURE_LIMIT',
    value,
    AUDIT_DEFAULTS.failureLimit,
    0,
    Number.MAX_SAFE_INTEGER
  );

/** BOT_AUDIT_VARIANT_SAMPLE: addresses requested as a browser. Default 20, 0 disables. */
const parseAuditVariantSample = (value) =>
  parseBoundedInteger(
    'BOT_AUDIT_VARIANT_SAMPLE',
    value,
    AUDIT_DEFAULTS.variantSample,
    0,
    AUDIT_MAX_VARIANT_SAMPLE
  );

/** BOT_AUDIT_TIME_BUDGET_MS: when the audit stops reading pages. Default 30 minutes, 1000 or more. */
const parseAuditTimeBudgetMs = (value) =>
  parseBoundedInteger(
    'BOT_AUDIT_TIME_BUDGET_MS',
    value,
    AUDIT_DEFAULTS.timeBudgetMs,
    1000,
    Number.MAX_SAFE_INTEGER
  );

/** The four settings of the audit, from the environment. */
const parseAuditConfig = (env = process.env) => ({
  sampleSize: parseAuditSampleSize(env.BOT_AUDIT_SAMPLE_SIZE),
  failureLimit: parseAuditFailureLimit(env.BOT_AUDIT_FAILURE_LIMIT),
  variantSample: parseAuditVariantSample(env.BOT_AUDIT_VARIANT_SAMPLE),
  timeBudgetMs: parseAuditTimeBudgetMs(env.BOT_AUDIT_TIME_BUDGET_MS),
});

module.exports = {
  AUDIT_DEFAULTS,
  AUDIT_MAX_SAMPLE_SIZE,
  AUDIT_MAX_VARIANT_SAMPLE,
  parseAuditSampleSize,
  parseAuditFailureLimit,
  parseAuditVariantSample,
  parseAuditTimeBudgetMs,
  parseAuditConfig,
  ENTITY_TYPES,
  HUB_TYPE,
  DEFAULT_SCHEDULE,
  parseEntityTypes,
  parseSchedule,
};
