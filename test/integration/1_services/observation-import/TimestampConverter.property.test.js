/* eslint-disable func-names */
/**
 * Property-based tests for the TimestampConverter service.
 *
 * Uses fast-check to verify Property 5: Timestamp parsing round-trip.
 *
 * Property 5: Timestamp parsing round-trip
 * For any valid timestamp, formatting it according to a dateFormat string and
 * then parsing it back using the same format and an IANA timezone SHALL produce
 * a UTC timestamp that, when converted back to the original timezone, equals
 * the original timestamp (to seconds precision).
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.5
 */
const should = require('should');
const fc = require('fast-check');
const dayjs = require('../../../../api/utils/dayjs');
const TimestampConverter = require('../../../../api/services/observation-import/TimestampConverter');

// ---------------------------------------------------------------------------
// Representative IANA timezones and date formats
// ---------------------------------------------------------------------------

const TIMEZONES = [
  'Europe/Paris',
  'America/New_York',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Kolkata',
  'America/Chicago',
];

const DATE_FORMATS = [
  'DD/MM/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
];

// ---------------------------------------------------------------------------
// Arbitrary: random datetime in [2000-01-01, 2030-12-31] with seconds precision
//
// Generate as a Unix timestamp (seconds) in the range, then truncate to
// seconds precision.
//
// Excludes timestamps that fall within a DST transition's ambiguous window
// (e.g., "fall back" where the same local time occurs twice). These cannot
// round-trip because the local representation is inherently ambiguous.
// ---------------------------------------------------------------------------

const MIN_UNIX_S = dayjs.utc('2000-01-01', 'YYYY-MM-DD').unix();
const MAX_UNIX_S = dayjs.utc('2030-12-31', 'YYYY-MM-DD').unix();

/**
 * Returns true if the given unix timestamp falls in a DST "fall back" window
 * for the given timezone — i.e., the local time representation is ambiguous.
 *
 * Detection: format the timestamp, then re-parse it. If the round-tripped
 * unix time differs, the local time is ambiguous.
 */
const isDSTAmbiguous = (unixSeconds, timezone) => {
  const d = dayjs.unix(unixSeconds).tz(timezone);
  const formatted = d.format('YYYY-MM-DD HH:mm:ss');
  const reparsed = dayjs.tz(formatted, 'YYYY-MM-DD HH:mm:ss', timezone);
  return reparsed.unix() !== unixSeconds;
};

/** Arbitrary Unix timestamp (seconds) in [2000, 2030] */
const unixSecondsArb = fc.integer({ min: MIN_UNIX_S, max: MAX_UNIX_S });

/** Arbitrary timezone from the representative set */
const timezoneArb = fc.constantFrom(...TIMEZONES);

/** Arbitrary date format from the representative set */
const dateFormatArb = fc.constantFrom(...DATE_FORMATS);

// ---------------------------------------------------------------------------
// Property 5: Timestamp parsing round-trip
// Validates: Requirements 4.1, 4.2, 4.3, 4.5
// ---------------------------------------------------------------------------

describe('TimestampConverter - Property 5: Timestamp parsing round-trip', () => {
  it('should round-trip: format → parse → convert back to original timezone yields same timestamp (seconds precision)', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        unixSecondsArb,
        timezoneArb,
        dateFormatArb,
        (unixSeconds, timezone, dateFormat) => {
          // Skip DST-ambiguous timestamps — they cannot round-trip because
          // the local time representation has two valid UTC interpretations.
          fc.pre(!isDSTAmbiguous(unixSeconds, timezone));

          // 1. Create a dayjs instance in the given timezone at the given unix time
          const original = dayjs.unix(unixSeconds).tz(timezone);

          // 2. Format it using the profile's dateFormat
          const formatted = original.format(dateFormat);

          // 3. Build the minimal profile and inputs for TimestampConverter
          const profile = {
            timezone,
            dateFormat,
            columnMappings: [
              {
                columnIndex: 0,
                role: 'timestamp',
                timestampType: 'datetime',
              },
            ],
          };
          const rows = [[formatted]];
          const columnIndices = [0];

          // 4. Parse via TimestampConverter
          const [utcDate] = TimestampConverter.convert(
            rows,
            profile,
            columnIndices
          );

          // 5. Convert the UTC result back to the original timezone
          const roundTripped = dayjs(utcDate).tz(timezone);

          // 6. Compare to seconds precision (truncate sub-second)
          const originalSec = original.unix();
          const roundTrippedSec = roundTripped.unix();

          should(roundTrippedSec).equal(
            originalSec,
            `Round-trip failed for timezone=${timezone}, format=${dateFormat}, ` +
              `original=${original.format()}, formatted='${formatted}', ` +
              `roundTripped=${roundTripped.format()}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round-trip for split dateOnly+timeOnly columns with the same timezone guarantees', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(unixSecondsArb, timezoneArb, (unixSeconds, timezone) => {
        const dateOnlyFormat = 'DD/MM/YYYY';
        const timeOnlyFormat = 'HH:mm:ss';

        // Skip DST-ambiguous timestamps
        fc.pre(!isDSTAmbiguous(unixSeconds, timezone));

        // 1. Create a dayjs instance in the given timezone
        const original = dayjs.unix(unixSeconds).tz(timezone);

        // 2. Format into separate date and time strings
        const dateStr = original.format(dateOnlyFormat);
        const timeStr = original.format(timeOnlyFormat);

        // 3. Build the profile for split timestamp columns
        const profile = {
          timezone,
          dateOnlyFormat,
          timeOnlyFormat,
          columnMappings: [
            {
              columnIndex: 0,
              role: 'timestamp',
              timestampType: 'dateOnly',
            },
            {
              columnIndex: 1,
              role: 'timestamp',
              timestampType: 'timeOnly',
            },
          ],
        };
        const rows = [[dateStr, timeStr]];
        const columnIndices = [0, 1];

        // 4. Parse via TimestampConverter
        const [utcDate] = TimestampConverter.convert(
          rows,
          profile,
          columnIndices
        );

        // 5. Convert back and compare
        const roundTripped = dayjs(utcDate).tz(timezone);
        const originalSec = original.unix();
        const roundTrippedSec = roundTripped.unix();

        should(roundTrippedSec).equal(
          originalSec,
          `Split round-trip failed for timezone=${timezone}, ` +
            `date='${dateStr}', time='${timeStr}', ` +
            `roundTripped=${roundTripped.format()}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Component-based timestamp round-trip
// For any valid date decomposed into year/month/day/hour/minute/second
// components, assembling via TimestampConverter and converting back to the
// original timezone SHALL yield the same components.
// ---------------------------------------------------------------------------

describe('TimestampConverter - Property 6: Component-based timestamp round-trip', () => {
  it('should round-trip: decompose → parse components → convert back yields same timestamp', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(unixSecondsArb, timezoneArb, (unixSeconds, timezone) => {
        // 1. Create a dayjs instance in the given timezone
        const original = dayjs.unix(unixSeconds).tz(timezone);

        // 2. Decompose into components
        const year = String(original.year());
        const month = String(original.month() + 1); // dayjs months are 0-based
        const day = String(original.date());
        const hour = String(original.hour());
        const minute = String(original.minute());
        const second = String(original.second());

        // 3. Build the profile for component columns
        const profile = {
          timezone,
          columnMappings: [
            { columnIndex: 0, role: 'timestamp', timestampType: 'year' },
            { columnIndex: 1, role: 'timestamp', timestampType: 'month' },
            { columnIndex: 2, role: 'timestamp', timestampType: 'day' },
            { columnIndex: 3, role: 'timestamp', timestampType: 'hour' },
            { columnIndex: 4, role: 'timestamp', timestampType: 'minute' },
            { columnIndex: 5, role: 'timestamp', timestampType: 'second' },
          ],
        };
        const rows = [[year, month, day, hour, minute, second]];
        const columnIndices = [0, 1, 2, 3, 4, 5];

        // 4. Parse via TimestampConverter
        const [utcDate] = TimestampConverter.convert(
          rows,
          profile,
          columnIndices
        );

        // 5. Convert back and compare
        const roundTripped = dayjs(utcDate).tz(timezone);
        const originalSec = original.unix();
        const roundTrippedSec = roundTripped.unix();

        should(roundTrippedSec).equal(
          originalSec,
          `Component round-trip failed for timezone=${timezone}, ` +
            `components=${year}-${month}-${day} ${hour}:${minute}:${second}, ` +
            `roundTripped=${roundTripped.format()}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Standalone epoch round-trip
// For any Unix timestamp, parsing it via elapsed_seconds (epoch mode)
// SHALL produce a UTC Date whose Unix timestamp matches the input exactly.
// ---------------------------------------------------------------------------

describe('TimestampConverter - Property 7: Standalone epoch round-trip', () => {
  it('should produce a Date whose Unix seconds match the input value exactly', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(unixSecondsArb, (unixSeconds) => {
        const profile = {
          timezone: 'UTC',
          columnMappings: [
            {
              columnIndex: 0,
              role: 'timestamp',
              timestampType: 'elapsed_seconds',
            },
          ],
        };
        const rows = [[String(unixSeconds)]];
        const columnIndices = [0];

        const [utcDate] = TimestampConverter.convert(
          rows,
          profile,
          columnIndices
        );

        const resultSec = Math.floor(utcDate.getTime() / 1000);

        should(resultSec).equal(
          unixSeconds,
          `Epoch round-trip failed: input=${unixSeconds}, output=${resultSec}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: elapsed_seconds offset additivity
// For any base datetime + elapsed seconds offset, the result SHALL equal
// the base time plus exactly that many seconds.
// ---------------------------------------------------------------------------

describe('TimestampConverter - Property 8: elapsed_seconds offset additivity', () => {
  /** Arbitrary elapsed offset in [0, 86400] (up to 24 hours) */
  const elapsedArb = fc.integer({ min: 0, max: 86400 });

  it('should produce a timestamp that is exactly elapsed_seconds ahead of the base', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        unixSecondsArb,
        timezoneArb,
        dateFormatArb,
        elapsedArb,
        (unixSeconds, timezone, dateFormat, elapsed) => {
          // Skip DST-ambiguous timestamps to avoid flaky results
          fc.pre(!isDSTAmbiguous(unixSeconds, timezone));

          const original = dayjs.unix(unixSeconds).tz(timezone);
          const formatted = original.format(dateFormat);

          // Parse without elapsed
          const profileBase = {
            timezone,
            dateFormat,
            columnMappings: [
              {
                columnIndex: 0,
                role: 'timestamp',
                timestampType: 'datetime',
              },
            ],
          };
          const [baseDate] = TimestampConverter.convert(
            [[formatted]],
            profileBase,
            [0]
          );

          // Parse with elapsed
          const profileWithElapsed = {
            timezone,
            dateFormat,
            columnMappings: [
              {
                columnIndex: 0,
                role: 'timestamp',
                timestampType: 'datetime',
              },
              {
                columnIndex: 1,
                role: 'timestamp',
                timestampType: 'elapsed_seconds',
              },
            ],
          };
          const [offsetDate] = TimestampConverter.convert(
            [[formatted, String(elapsed)]],
            profileWithElapsed,
            [0, 1]
          );

          const diffMs = offsetDate.getTime() - baseDate.getTime();
          const diffSec = Math.round(diffMs / 1000);

          should(diffSec).equal(
            elapsed,
            `Offset additivity failed: expected +${elapsed}s, got +${diffSec}s`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
