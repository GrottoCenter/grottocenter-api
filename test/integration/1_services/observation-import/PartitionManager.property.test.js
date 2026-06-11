/* eslint-disable func-names */
/**
 * Property-based tests for PartitionManager.
 *
 * Verifies structural invariants of quarter extraction and boundary computation
 * that must hold for any valid timestamp input:
 *
 * Property 1: Coverage — every input timestamp falls within the half-open
 *   interval [start, end) of exactly one returned quarter.
 *
 * Property 2: Idempotence — calling extractQuarters twice with the same input
 *   produces identical output (deterministic deduplication + sort).
 *
 * Property 3: Boundary containment — for any (year, quarter) pair, the start
 *   date is the first day of that quarter and the end date is the first day
 *   of the following quarter, forming a valid half-open interval.
 *
 * Property 4: No duplicates — the output of extractQuarters never contains
 *   duplicate (year, quarter) pairs.
 *
 * Property 5: Monotonic sort — output quarters are strictly ascending by
 *   (year, quarter) composite key.
 */
const should = require('should');
const fc = require('fast-check');
const PartitionManager = require('../../../../api/services/observation-import/PartitionManager');

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a UTC Date within a realistic sensor measurement range.
 * Covers 2000-01-01 through 2060-12-31 — broader than current partitions to
 * exercise partition creation for unexpected date ranges.
 */
const timestampArb = fc
  .integer({
    min: new Date('2000-01-01T00:00:00Z').getTime(),
    max: new Date('2060-12-31T23:59:59Z').getTime(),
  })
  .map((ms) => new Date(ms));

/**
 * A non-empty array of timestamps (1–200 elements).
 */
const timestampsArb = fc.array(timestampArb, { minLength: 1, maxLength: 200 });

/**
 * A (year, quarter) pair in a valid range.
 */
const yearQuarterArb = fc.record({
  year: fc.integer({ min: 1970, max: 2100 }),
  quarter: fc.integer({ min: 1, max: 4 }),
});

// ---------------------------------------------------------------------------
// Property 1: Coverage — every timestamp maps to exactly one returned quarter
// ---------------------------------------------------------------------------

describe('PartitionManager - Property: coverage', function () {
  this.timeout(30000);

  it('every input timestamp falls within exactly one extracted quarter boundary', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const quarters = PartitionManager.extractQuarters(timestamps);

        for (const ts of timestamps) {
          const year = ts.getUTCFullYear();
          const quarter = Math.ceil((ts.getUTCMonth() + 1) / 3);

          const found = quarters.find(
            (q) => q.year === year && q.quarter === quarter
          );
          should(found).not.be.undefined();

          const { start, end } = PartitionManager.computeBoundaries(
            year,
            quarter
          );
          const startMs = new Date(`${start}T00:00:00Z`).getTime();
          const endMs = new Date(`${end}T00:00:00Z`).getTime();
          const tsMs = ts.getTime();

          should(tsMs >= startMs).be.true();
          should(tsMs < endMs).be.true();
        }
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Idempotence — deterministic output
// ---------------------------------------------------------------------------

describe('PartitionManager - Property: idempotence', function () {
  this.timeout(15000);

  it('extractQuarters produces identical output on repeated calls', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const first = PartitionManager.extractQuarters(timestamps);
        const second = PartitionManager.extractQuarters(timestamps);
        should(first).deepEqual(second);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Boundary containment — valid half-open interval for any quarter
// ---------------------------------------------------------------------------

describe('PartitionManager - Property: boundary containment', function () {
  this.timeout(15000);

  it('start is first day of quarter and end is first day of next quarter', () => {
    fc.assert(
      fc.property(yearQuarterArb, ({ year, quarter }) => {
        const { start, end } = PartitionManager.computeBoundaries(
          year,
          quarter
        );

        const startDate = new Date(`${start}T00:00:00Z`);
        const endDate = new Date(`${end}T00:00:00Z`);

        // Start must be the first day of the expected month
        const expectedStartMonth = (quarter - 1) * 3;
        should(startDate.getUTCFullYear()).equal(year);
        should(startDate.getUTCMonth()).equal(expectedStartMonth);
        should(startDate.getUTCDate()).equal(1);

        // End must be exactly 3 months after start (first day of next quarter)
        const expectedEndMonth = expectedStartMonth + 3;
        const expectedEndYear = expectedEndMonth >= 12 ? year + 1 : year;
        const expectedEndMonthNorm = expectedEndMonth % 12;
        should(endDate.getUTCFullYear()).equal(expectedEndYear);
        should(endDate.getUTCMonth()).equal(expectedEndMonthNorm);
        should(endDate.getUTCDate()).equal(1);

        // Interval must be non-empty (start < end)
        should(startDate.getTime()).be.lessThan(endDate.getTime());
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: No duplicates in output
// ---------------------------------------------------------------------------

describe('PartitionManager - Property: no duplicates', function () {
  this.timeout(15000);

  it('extractQuarters never returns duplicate (year, quarter) pairs', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const quarters = PartitionManager.extractQuarters(timestamps);
        const keys = quarters.map((q) => `${q.year}_${q.quarter}`);
        const unique = [...new Set(keys)];
        should(keys.length).equal(unique.length);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Monotonic sort — strictly ascending composite key
// ---------------------------------------------------------------------------

describe('PartitionManager - Property: monotonic sort', function () {
  this.timeout(15000);

  it('output quarters are strictly ascending by (year, quarter)', () => {
    fc.assert(
      fc.property(timestampsArb, (timestamps) => {
        const quarters = PartitionManager.extractQuarters(timestamps);

        for (let i = 1; i < quarters.length; i += 1) {
          const prev = quarters[i - 1];
          const curr = quarters[i];
          const prevKey = prev.year * 4 + prev.quarter;
          const currKey = curr.year * 4 + curr.quarter;
          should(currKey > prevKey).be.true();
        }
      }),
      { numRuns: 200 }
    );
  });
});
