const should = require('should');
const fc = require('fast-check');
const { SIZE, getCaveSize } = require('../../../api/utils/entranceMapCriteria');

// A cave dimension as t_cave stores it: NULL, or an integer in metres. The
// range reaches past both thresholds and includes the (invalid but storable)
// negative values; constantFrom pins the threshold neighbours so every run
// exercises the boundaries rather than relying on chance.
const dimensionArb = fc.option(
  fc.oneof(
    fc.integer({ min: -1, max: 1000000 }),
    fc.constantFrom(29, 30, 99, 100, 199, 200, 999, 1000)
  ),
  { nil: null }
);

describe('entranceMapCriteria - Property Tests', () => {
  /**
   * Property 1: Size classification partitions the plane
   *
   * For any depth and length, getCaveSize returns LARGE when either dimension
   * reaches its large threshold, otherwise MEDIUM when either reaches its
   * medium threshold, otherwise SMALL; null counts as zero. The expected value
   * is written as independent comparisons against literal thresholds, so a
   * wrong threshold, a strict comparison, or an `&&` instead of `||` in the
   * implementation fails it.
   *
   * Validates: Requirements 1.1–1.4
   */
  describe('Property 1: Size classification partitions the plane', () => {
    it('should classify every (depth, length) pair into exactly the expected size', () => {
      fc.assert(
        fc.property(dimensionArb, dimensionArb, (depth, length) => {
          const d = depth === null ? 0 : depth;
          const l = length === null ? 0 : length;
          const isLarge = d >= 100 || l >= 1000;
          const isMedium = !isLarge && (d >= 30 || l >= 200);
          let expected = SIZE.SMALL;
          if (isLarge) expected = SIZE.LARGE;
          else if (isMedium) expected = SIZE.MEDIUM;

          should(getCaveSize(depth, length)).equal(expected);
        }),
        { numRuns: 100 }
      );
    });

    it('should never classify a larger cave as a smaller size', () => {
      fc.assert(
        fc.property(
          dimensionArb,
          dimensionArb,
          fc.nat({ max: 5000 }),
          fc.nat({ max: 5000 }),
          (depth, length, extraDepth, extraLength) => {
            const before = getCaveSize(depth, length);
            const after = getCaveSize(
              (depth ?? 0) + extraDepth,
              (length ?? 0) + extraLength
            );
            should(after).be.aboveOrEqual(before);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
