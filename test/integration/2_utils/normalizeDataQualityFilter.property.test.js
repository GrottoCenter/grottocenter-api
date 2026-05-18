/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const normalizeDataQualityFilter = require('../../../api/utils/normalizeDataQualityFilter');

/**
 * Property-based tests for normalizeDataQualityFilter.
 *
 * Validates: Requirements R3-AC1, R3-AC2, R3-AC3, R3-AC4, R3-AC5, R3-AC6
 */

describe('normalizeDataQualityFilter - Property Tests', () => {
  /**
   * Property 1: Valid range — output bounds are always clamped to [0, 100]
   *
   * For any two numeric values used as min and max, the resulting
   * dataQuality array should contain values in [0, 100].
   *
   * Validates: Requirements R3-AC1, R3-AC4
   */
  describe('Property 1: Output bounds are always clamped to [0, 100]', () => {
    it('should clamp both min and max to [0, 100] for any numeric inputs', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.double({ noNaN: true }),
          fc.double({ noNaN: true }),
          (min, max) => {
            const result = normalizeDataQualityFilter({
              dataQuality: [min, max],
            });
            should(result).have.property('dataQuality');
            should(result.dataQuality).be.an.Array();
            should(result.dataQuality).have.length(2);
            should(result.dataQuality[0]).be.greaterThanOrEqual(0);
            should(result.dataQuality[0]).be.lessThanOrEqual(100);
            should(result.dataQuality[1]).be.greaterThanOrEqual(0);
            should(result.dataQuality[1]).be.lessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Null bounds — null min defaults to 0, null max defaults to 100
   *
   * When one bound is null, it should be replaced with the default
   * (0 for min, 100 for max).
   *
   * Validates: Requirements R3-AC2, R3-AC3
   */
  describe('Property 2: Null bounds default to 0 (min) and 100 (max)', () => {
    it('should replace null min with 0', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (max) => {
          const result = normalizeDataQualityFilter({
            dataQuality: [null, max],
          });
          should(result.dataQuality[0]).equal(0);
          should(result.dataQuality[1]).equal(max);
        }),
        { numRuns: 100 }
      );
    });

    it('should replace null max with 100', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (min) => {
          const result = normalizeDataQualityFilter({
            dataQuality: [min, null],
          });
          should(result.dataQuality[0]).equal(min);
          should(result.dataQuality[1]).equal(100);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle single-element array [min] as [min, 100]', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (min) => {
          const result = normalizeDataQualityFilter({ dataQuality: [min] });
          should(result.dataQuality[0]).equal(min);
          should(result.dataQuality[1]).equal(100);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Out-of-range clamping — values below 0 become 0, above 100 become 100
   *
   * Validates: Requirements R3-AC4
   */
  describe('Property 3: Out-of-range values are clamped', () => {
    it('should clamp negative values to 0', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: -1000, max: -1 }),
          (min, max) => {
            const result = normalizeDataQualityFilter({
              dataQuality: [min, max],
            });
            should(result.dataQuality[0]).equal(0);
            should(result.dataQuality[1]).equal(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp values above 100 to 100', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.integer({ min: 101, max: 1000 }),
          fc.integer({ min: 101, max: 1000 }),
          (min, max) => {
            const result = normalizeDataQualityFilter({
              dataQuality: [min, max],
            });
            should(result.dataQuality[0]).equal(100);
            should(result.dataQuality[1]).equal(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: min > max is preserved after clamping
   *
   * When min > max (after clamping), the filter is still applied
   * (Typesense will naturally return empty results).
   *
   * Validates: Requirements R3-AC5
   */
  describe('Property 4: min > max is preserved after clamping', () => {
    it('should preserve min > max ordering when both are in valid range', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 99 }),
          (min, max) => {
            fc.pre(min > max);
            const result = normalizeDataQualityFilter({
              dataQuality: [min, max],
            });
            should(result.dataQuality[0]).equal(min);
            should(result.dataQuality[1]).equal(max);
            should(result.dataQuality[0]).be.greaterThan(result.dataQuality[1]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Non-numeric values cause filter removal
   *
   * When the dataQuality filter contains non-numeric values (excluding null),
   * the filter key is removed entirely.
   *
   * Validates: Requirements R3-AC6
   */
  describe('Property 5: Non-numeric values cause filter removal', () => {
    it('should remove dataQuality filter when min is non-numeric string', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.string().filter((s) => Number.isNaN(Number(s)) && s !== ''),
          fc.integer({ min: 0, max: 100 }),
          (nonNumeric, max) => {
            const result = normalizeDataQualityFilter({
              dataQuality: [nonNumeric, max],
              otherFilter: 'kept',
            });
            should(result).not.have.property('dataQuality');
            should(result).have.property('otherFilter', 'kept');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove dataQuality filter when max is non-numeric string', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.string().filter((s) => Number.isNaN(Number(s)) && s !== ''),
          (min, nonNumeric) => {
            const result = normalizeDataQualityFilter({
              dataQuality: [min, nonNumeric],
              otherFilter: 'kept',
            });
            should(result).not.have.property('dataQuality');
            should(result).have.property('otherFilter', 'kept');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Other filter keys are preserved
   *
   * The normalization should not affect other keys in the filter object.
   */
  describe('Property 6: Other filter keys are preserved', () => {
    it('should preserve all non-dataQuality filter keys', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.string(),
          (min, max, otherValue) => {
            const input = {
              dataQuality: [min, max],
              someOtherKey: otherValue,
            };
            const result = normalizeDataQualityFilter(input);
            should(result).have.property('someOtherKey', otherValue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: No dataQuality key — filter passes through unchanged
   */
  describe('Property 7: Filter without dataQuality passes through unchanged', () => {
    it('should return the filter unchanged when no dataQuality key exists', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.string(), fc.integer(), (strVal, intVal) => {
          const input = { name: strVal, count: intVal };
          const result = normalizeDataQualityFilter(input);
          should(result).deepEqual(input);
        }),
        { numRuns: 100 }
      );
    });
  });
});
