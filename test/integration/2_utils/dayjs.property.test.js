/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const dayjs = require('../../../api/utils/dayjs');

/**
 * Arbitrary: generates a valid YYYY-MM-DD date string.
 * Uses fc.date() constrained to a reasonable range, then formats using
 * UTC accessors to avoid timezone-dependent boundary drift.
 */
const validDateStringArb = fc
  .date({
    min: new Date('1900-01-01T00:00:00Z'),
    max: new Date('2099-12-31T00:00:00Z'),
    noInvalidDate: true,
  })
  .map((d) => {
    const year = d.getUTCFullYear().toString().padStart(4, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

/**
 * Arbitrary: generates strings that are NOT valid YYYY-MM-DD dates.
 * Includes malformed dates, random strings, empty strings, and overflow dates.
 */
const invalidDateStringArb = fc.oneof(
  { weight: 1, arbitrary: fc.constant('') },
  { weight: 1, arbitrary: fc.constant('not-a-date') },
  { weight: 1, arbitrary: fc.constant('01-01-2024') },
  { weight: 1, arbitrary: fc.constant('2024/01/01') },
  { weight: 1, arbitrary: fc.constant('2024-1-5') },
  { weight: 1, arbitrary: fc.constant('2024-01-01T00:00:00') },
  { weight: 1, arbitrary: fc.constant('2024-01-01 trailing') },
  { weight: 1, arbitrary: fc.constant('2024-02-30') },
  { weight: 1, arbitrary: fc.constant('2024-13-01') },
  { weight: 1, arbitrary: fc.constant('2024-00-15') },
  { weight: 1, arbitrary: fc.constant('2024-04-31') },
  {
    weight: 3,
    arbitrary: fc
      .string({ minLength: 0, maxLength: 30 })
      .filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
  },
  {
    weight: 2,
    arbitrary: fc
      .tuple(
        fc.integer({ min: 1900, max: 2099 }),
        fc.integer({ min: 13, max: 99 }),
        fc.integer({ min: 1, max: 31 })
      )
      .map(
        ([y, m, d]) =>
          `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      ),
  },
  {
    weight: 2,
    arbitrary: fc
      .tuple(
        fc.integer({ min: 1900, max: 2099 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 29, max: 50 })
      )
      .map(([y, m, d]) => {
        const formatted = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        const parsed = new Date(
          `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T00:00:00Z`
        );
        if (
          parsed.getUTCFullYear() === y &&
          parsed.getUTCMonth() + 1 === m &&
          parsed.getUTCDate() === d
        ) {
          // This is actually a valid date, replace with a known invalid one
          return '2024-02-30';
        }
        return formatted;
      }),
  }
);

describe('dayjs - Property Tests', () => {
  /**
   * Property 1: Date parsing equivalence
   *
   * For any valid YYYY-MM-DD string, dayjs(s, 'YYYY-MM-DD', true) produces
   * a valid dayjs object whose year, month, and date values match the
   * components of the input string.
   *
   * Validates: Requirements 2.1
   */
  describe('Property 1: Date parsing equivalence', () => {
    it('should parse valid YYYY-MM-DD strings into correct year/month/date values', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(validDateStringArb, (s) => {
          const parsed = dayjs(s, 'YYYY-MM-DD', true);
          should(parsed.isValid()).equal(true);

          // Extract expected components from the input string
          const [yearStr, monthStr, dayStr] = s.split('-');
          const expectedYear = parseInt(yearStr, 10);
          const expectedMonth = parseInt(monthStr, 10); // 1-based
          const expectedDay = parseInt(dayStr, 10);

          should(parsed.year()).equal(expectedYear);
          should(parsed.month() + 1).equal(expectedMonth); // dayjs month is 0-based
          should(parsed.date()).equal(expectedDay);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Invalid date rejection
   *
   * For any string not matching YYYY-MM-DD (malformed dates, random strings,
   * empty strings, overflow dates like 2024-02-30), dayjs(s, 'YYYY-MM-DD', true).isValid()
   * returns false.
   *
   * Validates: Requirements 2.2, 2.3, 2.4
   */
  describe('Property 2: Invalid date rejection', () => {
    it('should return isValid() === false for strings not matching YYYY-MM-DD', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(invalidDateStringArb, (s) => {
          should(dayjs(s, 'YYYY-MM-DD', true).isValid()).equal(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Duration format correctness
   *
   * For any object with hours (≥ 0), minutes (0–59), and seconds (0–59),
   * dayjs.duration({hours, minutes, seconds}).format('HH:mm:ss') produces
   * a string matching /^\d{2,}:\d{2}:\d{2}$/ with correct zero-padding,
   * without wrapping hours at 24.
   *
   * Validates: Requirements 4.1, 4.2, 4.4
   */
  describe('Property 3: Duration format correctness', () => {
    /**
     * Helper: converts a PostgreSQL interval object to an HH:mm:ss string,
     * replicating the migration logic from CommentService where days are
     * accumulated into hours (days × 24 + hours).
     */
    const formatDuration = (pgInterval) => {
      if (!pgInterval) return null;
      const { days = 0, hours = 0, minutes = 0, seconds = 0 } = pgInterval;
      const totalHours = days * 24 + hours;
      return dayjs
        .duration({ hours: totalHours, minutes, seconds })
        .format('HH:mm:ss');
    };

    it('should produce a zero-padded HH:mm:ss string for any valid duration', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.nat({ max: 999 }), // hours: 0–999
          fc.nat({ max: 59 }), // minutes: 0–59
          fc.nat({ max: 59 }), // seconds: 0–59
          (hours, minutes, seconds) => {
            const result = dayjs
              .duration({ hours, minutes, seconds })
              .format('HH:mm:ss');

            // Must match the pattern: 2+ digit hours, 2-digit minutes, 2-digit seconds
            should(result).match(/^\d{2,}:\d{2}:\d{2}$/);

            // Verify correct values by parsing the result
            const parts = result.split(':');
            should(parseInt(parts[0], 10)).equal(hours);
            should(parseInt(parts[1], 10)).equal(minutes);
            should(parseInt(parts[2], 10)).equal(seconds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accumulate days into hours (days × 24 + hours) without wrapping', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.nat({ max: 30 }), // days: 0–30
          fc.nat({ max: 23 }), // hours: 0–23
          fc.nat({ max: 59 }), // minutes: 0–59
          fc.nat({ max: 59 }), // seconds: 0–59
          (days, hours, minutes, seconds) => {
            const result = formatDuration({ days, hours, minutes, seconds });

            // Must match the pattern
            should(result).match(/^\d{2,}:\d{2}:\d{2}$/);

            // Hours should be days * 24 + hours (no wrapping at 24)
            const parts = result.split(':');
            const expectedHours = days * 24 + hours;
            should(parseInt(parts[0], 10)).equal(expectedHours);
            should(parseInt(parts[1], 10)).equal(minutes);
            should(parseInt(parts[2], 10)).equal(seconds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat missing fields as zero', () => {
      const cases = [
        { input: { hours: 5 }, expected: '05:00:00' },
        { input: { minutes: 30 }, expected: '00:30:00' },
        { input: { seconds: 45 }, expected: '00:00:45' },
        { input: { hours: 2, minutes: 15 }, expected: '02:15:00' },
        { input: { hours: 1, seconds: 30 }, expected: '01:00:30' },
        { input: { minutes: 10, seconds: 20 }, expected: '00:10:20' },
        { input: {}, expected: '00:00:00' },
      ];

      for (const { input, expected } of cases) {
        const result = formatDuration(input);
        should(result).equal(expected);
      }
    });
  });
});
