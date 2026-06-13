/* eslint-disable func-names */
/**
 * Property-based tests for ProfileValidator.
 *
 * These tests use fast-check to verify correctness properties that must hold
 * for all inputs, not just the specific examples in the unit test file.
 *
 * ProfileValidator is a pure synchronous function — no DB access, no stubs needed.
 */
const should = require('should');
const fc = require('fast-check');
const ProfileValidator = require('../../../../api/services/observation-import/ProfileValidator');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Use Intl.DateTimeFormat as ground truth for valid timezone names */
const isValidTimezone = (tz) => {
  if (typeof tz !== 'string' || tz.length === 0) return false;
  if (/^[+-]\d|^(GMT|UTC)[+-]/.test(tz)) return false;
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
const VALID_TIMEZONE_ARRAY = Intl.supportedValuesOf('timeZone');

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

/** A valid IANA timezone name (use first 50 for performance) */
const validTimezoneArb = fc.constantFrom(...VALID_TIMEZONE_ARRAY.slice(0, 50));

/** Strings that are not valid IANA timezone names */
const invalidTimezoneArb = fc.oneof(
  fc.constantFrom(
    '+02:00',
    '-05:00',
    'GMT+2',
    'UTC+1',
    'invalid',
    'Europe',
    'Paris',
    'UTC+0',
    'Not/A/Timezone',
    'Fake/City'
  ),
  fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => s.trim().length > 0 && !isValidTimezone(s))
);

/** A positive integer suitable for IDs */
const idArb = fc.integer({ min: 1, max: 100000 });

/** A minimal valid profile with all required fields and no violations */
const minimalValidProfileArb = fc.record({
  timezone: validTimezoneArb,
  authorIds: fc.uniqueArray(idArb, { minLength: 1, maxLength: 3 }),
  licenseId: idArb,
  dateFormat: fc.constant('YYYY-MM-DD HH:mm:ss'),
  columnMappings: fc
    .integer({ min: 1, max: 4 })
    .chain((n) =>
      fc.tuple(
        // At least 1 timestamp column
        fc.constant({
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'datetime',
        }),
        // At least 1 measurement column
        fc.constant({
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 42,
        }),
        // Extra measurement columns
        ...Array.from({ length: n - 1 }, (_, i) =>
          fc.constant({
            columnIndex: i + 2,
            role: 'measurement',
            sensorConfigurationId: 10 + i,
          })
        )
      )
    )
    .map((cols) => (Array.isArray(cols) ? cols : [cols])),
  caveId: idArb,
});

// ---------------------------------------------------------------------------
// Violation builders
// Each apply() transforms a profile to introduce exactly ONE independent
// violation. They are designed so that later violations in the list can
// override earlier ones, and the reference counter handles that correctly.
// ---------------------------------------------------------------------------

const VIOLATIONS = [
  {
    name: 'missing timezone',
    apply: (p) => ({ ...p, timezone: undefined }),
  },
  {
    name: 'missing authorIds',
    apply: (p) => {
      const q = { ...p };
      delete q.authorIds;
      return q;
    },
  },
  {
    name: 'missing licenseId',
    apply: (p) => ({ ...p, licenseId: undefined }),
  },
  {
    name: 'missing columnMappings',
    apply: (p) => ({ ...p, columnMappings: undefined }),
  },
  {
    name: 'invalid timezone (fixed offset)',
    apply: (p) => ({ ...p, timezone: '+02:00' }),
  },
  {
    name: 'invalid numberLocale',
    apply: (p) => ({ ...p, numberLocale: 'de' }),
  },
  {
    name: 'invalid dataQuality',
    apply: (p) => ({ ...p, dataQuality: 'good' }),
  },
  {
    name: 'no caveId and no pointLabel',
    apply: (p) => {
      const q = { ...p };
      delete q.caveId;
      delete q.pointLabel;
      return q;
    },
  },
  {
    name: 'no timestamp column in columnMappings',
    apply: (p) => ({
      ...p,
      columnMappings: [
        { columnIndex: 0, role: 'measurement', sensorConfigurationId: 5 },
      ],
    }),
  },
  {
    name: 'no measurement column in columnMappings',
    apply: (p) => ({
      ...p,
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
      ],
    }),
  },
  {
    name: 'measurement column missing sensorConfigurationId',
    apply: (p) => ({
      ...p,
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        { columnIndex: 1, role: 'measurement' /* no sensorConfigurationId */ },
      ],
    }),
  },
];

// ---------------------------------------------------------------------------
// Reference error counter
//
// Mirrors the logic in ProfileValidator.validate() and is used as the ground
// truth in Property 1. This avoids the "counting applied violations" approach
// which breaks when violations override each other.
// ---------------------------------------------------------------------------

/**
 * Counts the number of distinct validation errors expected for a given profile
 * by replicating the same rules as ProfileValidator.
 */
function countExpectedProfileErrors(profile) {
  let count = 0;

  if (!profile || typeof profile !== 'object') return 1;

  // Required fields
  ['timezone', 'columnMappings', 'authorIds', 'licenseId'].forEach((field) => {
    if (
      profile[field] === undefined ||
      profile[field] === null ||
      profile[field] === ''
    ) {
      count += 1;
    }
  });

  // IANA timezone validation (only if timezone is present and non-empty)
  if (
    profile.timezone !== undefined &&
    profile.timezone !== null &&
    profile.timezone !== ''
  ) {
    if (!isValidTimezone(profile.timezone)) {
      count += 1;
    }
  }

  // columnMappings structural validation (only if it is an array)
  if (Array.isArray(profile.columnMappings)) {
    const hasTimestamp = profile.columnMappings.some(
      (col) => col.role === 'timestamp'
    );
    const hasMeasurement = profile.columnMappings.some(
      (col) => col.role === 'measurement'
    );

    if (!hasTimestamp) count += 1;
    if (!hasMeasurement) count += 1;

    // Per-column sensorConfigurationId check
    profile.columnMappings.forEach((col) => {
      if (col.role === 'measurement' && !col.sensorConfigurationId) {
        count += 1;
      }
    });

    // Timestamp column pairing
    const hasDateOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'dateOnly'
    );
    const hasTimeOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'timeOnly'
    );
    if (hasDateOnly && !hasTimeOnly) count += 1;
    if (hasTimeOnly && !hasDateOnly) count += 1;
  }

  // caveId or pointLabel
  const hasCaveId = profile.caveId !== undefined && profile.caveId !== null;
  const hasPointLabel =
    profile.pointLabel !== undefined &&
    profile.pointLabel !== null &&
    profile.pointLabel !== '';
  if (!hasCaveId && !hasPointLabel) count += 1;

  // numberLocale (only if provided)
  if (
    profile.numberLocale !== undefined &&
    profile.numberLocale !== null &&
    profile.numberLocale !== ''
  ) {
    if (!['en', 'fr'].includes(profile.numberLocale)) count += 1;
  }

  // dataQuality (only if provided)
  if (
    profile.dataQuality !== undefined &&
    profile.dataQuality !== null &&
    profile.dataQuality !== ''
  ) {
    if (
      !['raw', 'validated', 'suspect', 'rejected'].includes(profile.dataQuality)
    ) {
      count += 1;
    }
  }

  // dateFormat required for datetime mode
  if (Array.isArray(profile.columnMappings)) {
    const hasDatetime = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'datetime'
    );
    if (hasDatetime && !profile.dateFormat) count += 1;

    // dateOnlyFormat and timeOnlyFormat required for split mode
    const hasDateOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'dateOnly'
    );
    const hasTimeOnly = profile.columnMappings.some(
      (col) => col.role === 'timestamp' && col.timestampType === 'timeOnly'
    );
    if (hasDateOnly && hasTimeOnly) {
      if (!profile.dateOnlyFormat) count += 1;
      if (!profile.timeOnlyFormat) count += 1;
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Property 1: Profile validation reports all errors
//
// For any profile with N distinct violations, the validator returns exactly
// N error messages.
//
// Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
// ---------------------------------------------------------------------------

/**
 * Property 1: Profile validation reports all errors
 * Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */
describe('ProfileValidator - Property 1: Profile validation reports all errors', () => {
  it('should return exactly N errors for any profile with N distinct violations', function () {
    this.timeout(30000);

    // Generate a random non-empty subset of violation indices
    const violationSubsetArb = fc
      .uniqueArray(fc.integer({ min: 0, max: VIOLATIONS.length - 1 }), {
        minLength: 1,
        maxLength: VIOLATIONS.length,
      })
      .map((indices) => indices.map((i) => VIOLATIONS[i]));

    fc.assert(
      fc.property(
        minimalValidProfileArb,
        violationSubsetArb,
        (base, subset) => {
          // Apply all violations sequentially to produce the final profile.
          // Violations can override each other, so we use the reference counter
          // (which re-evaluates the final profile state) instead of counting
          // violations applied.
          let profile = { ...base };
          for (const violation of subset) {
            profile = violation.apply(profile);
          }

          const actualErrors = ProfileValidator.validate(profile);
          const expectedCount = countExpectedProfileErrors(profile);

          should(actualErrors.length).equal(
            expectedCount,
            `Expected ${expectedCount} errors but got ${actualErrors.length}.\n` +
              `Violations applied: [${subset.map((v) => v.name).join(', ')}]\n` +
              `Profile: ${JSON.stringify(profile)}\n` +
              `Actual errors: ${JSON.stringify(actualErrors)}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Valid IANA timezone acceptance
//
// For any string value, the timezone validator accepts it if and only if it
// appears in Intl.supportedValuesOf('timeZone'). Fixed offsets are rejected.
//
// Validates: Requirements 2.2, 2.3
// ---------------------------------------------------------------------------

/**
 * Builds a minimal profile with only the timezone field set to the given value.
 * All other required fields are valid so timezone is the only potential error.
 */
const profileWithTimezone = (tz) => ({
  timezone: tz,
  authorIds: [1],
  licenseId: 1,
  caveId: 1,
  columnMappings: [
    { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
    { columnIndex: 1, role: 'measurement', sensorConfigurationId: 5 },
  ],
});

/**
 * Property 2: Valid IANA timezone acceptance
 * Validates: Requirements 2.2, 2.3
 */
describe('ProfileValidator - Property 2: Valid IANA timezone acceptance', () => {
  it('should accept all valid IANA timezone names and reject all others', function () {
    this.timeout(30000);

    // Test valid timezones — should produce 0 timezone-related errors
    fc.assert(
      fc.property(validTimezoneArb, (tz) => {
        const errors = ProfileValidator.validate(profileWithTimezone(tz));
        const timezoneErrors = errors.filter(
          (e) =>
            e.toLowerCase().includes('timezone') ||
            e.toLowerCase().includes('iana')
        );
        should(timezoneErrors.length).equal(
          0,
          `Valid IANA timezone '${tz}' was incorrectly rejected: ${JSON.stringify(timezoneErrors)}`
        );
      }),
      { numRuns: 100 }
    );

    // Test invalid timezones — should produce at least 1 timezone error
    fc.assert(
      fc.property(invalidTimezoneArb, (tz) => {
        // Guard: skip if this happens to be a valid IANA timezone
        if (isValidTimezone(tz)) return;

        const errors = ProfileValidator.validate(profileWithTimezone(tz));
        const timezoneErrors = errors.filter(
          (e) =>
            e.toLowerCase().includes('timezone') ||
            e.toLowerCase().includes('iana')
        );
        should(timezoneErrors.length).be.aboveOrEqual(
          1,
          `Invalid timezone '${tz}' was not rejected. All errors: ${JSON.stringify(errors)}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should reject fixed-offset timezone strings like "+02:00"', function () {
    this.timeout(10000);
    const fixedOffsets = [
      '+02:00',
      '-05:00',
      '+00:00',
      '+14:00',
      '-12:00',
      '+05:30',
    ];
    for (const tz of fixedOffsets) {
      const errors = ProfileValidator.validate(profileWithTimezone(tz));
      const timezoneErrors = errors.filter(
        (e) =>
          e.toLowerCase().includes('timezone') ||
          e.toLowerCase().includes('iana')
      );
      should(timezoneErrors.length).be.aboveOrEqual(
        1,
        `Fixed-offset timezone '${tz}' should be rejected but was accepted`
      );
    }
  });
});
