/* eslint-disable func-names */
/**
 * Property-based tests for the SIConverter service.
 *
 * Uses fast-check to verify Property 6: SI conversion formula correctness.
 *
 * Property 6: SI conversion formula correctness
 * For any measurement value V and unit with non-zero siToDisplayFactor F
 * and siToDisplayOffset O:
 *   - value_si = (V - O) / F
 *   - Reverse: V_reconstructed = value_si * F + O SHALL equal V (within floating-point tolerance)
 *
 * Validates: Requirements 5.2, 5.4
 */
const should = require('should');
const fc = require('fast-check');
const SIConverter = require('../../../../api/services/observation-import/SIConverter');

// ---------------------------------------------------------------------------
// Tolerance
//
// Relative tolerance for round-trip equality.
// Used as: |result - expected| <= EPSILON * |expected| + EPSILON
// ---------------------------------------------------------------------------
const EPSILON = 1e-5;

// ---------------------------------------------------------------------------
// Arbitraries
//
// The SI conversion round-trip (V → value_si → V_reconstructed) only holds
// within floating-point precision when V, F, and O are in compatible magnitude
// ranges. Extreme combinations (e.g., |V| << |O|, near-subnormal F) cause
// catastrophic cancellation inherent to IEEE 754, which is not a formula bug.
//
// We constrain to realistic sensor measurement ranges:
//   - values in [-1e6, 1e6]  (e.g., temperature, pressure, CO₂ ppm, depth)
//   - factor in [-1e4, 1e4] \ {near-zero}  (unit scaling)
//   - offset in [-1e6, 1e6]  (e.g., 273.15 for K↔°C)
// ---------------------------------------------------------------------------

/** A realistic sensor measurement value. */
const measurementValueArb = fc.double({
  min: -1e6,
  max: 1e6,
  noNaN: true,
  noDefaultInfinity: true,
});

/** A non-zero factor in a realistic sensor scaling range. */
const nonZeroFactorArb = fc
  .double({ min: -1e4, max: 1e4, noNaN: true, noDefaultInfinity: true })
  .filter((f) => Math.abs(f) >= 1e-6);

/** An offset in a realistic sensor range. */
const offsetArb = fc.double({
  min: -1e6,
  max: 1e6,
  noNaN: true,
  noDefaultInfinity: true,
});

// ---------------------------------------------------------------------------
// Property 6: SI conversion formula correctness
// Validates: Requirements 5.2, 5.4
// ---------------------------------------------------------------------------

describe('SIConverter - Property 6: SI conversion formula correctness', () => {
  it('should compute value_si = (V - O) / F and be invertible: V_reconstructed = value_si * F + O ≈ V', function () {
    this.timeout(30000);

    fc.assert(
      fc.property(
        measurementValueArb, // V: measurement value
        nonZeroFactorArb, // F: siToDisplayFactor (non-zero)
        offsetArb, // O: siToDisplayOffset
        (V, F, O) => {
          // Skip cases where intermediate arithmetic yields non-finite results
          const expectedSi = (V - O) / F;
          if (!Number.isFinite(expectedSi)) return;

          const unit = {
            siToDisplayFactor: F,
            siToDisplayOffset: O,
          };

          const valueSi = SIConverter.toSI(V, unit);

          // 1. Check forward formula
          should(valueSi).be.approximately(
            expectedSi,
            Math.abs(expectedSi) * EPSILON + EPSILON,
            `toSI(${V}, {F=${F}, O=${O}}) expected ${expectedSi} but got ${valueSi}`
          );

          // 2. Check round-trip: V_reconstructed = valueSi * F + O ≈ V
          const vReconstructed = valueSi * F + O;
          if (!Number.isFinite(vReconstructed)) return;

          should(vReconstructed).be.approximately(
            V,
            Math.abs(V) * EPSILON + EPSILON,
            `Round-trip failed: V=${V}, F=${F}, O=${O}, valueSi=${valueSi}, reconstructed=${vReconstructed}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw for any zero factor', function () {
    this.timeout(10000);

    fc.assert(
      fc.property(
        measurementValueArb, // V
        offsetArb, // O
        (V, O) => {
          const unit = { siToDisplayFactor: 0, siToDisplayOffset: O };
          should(() => SIConverter.toSI(V, unit)).throw(
            /zero|factor/i,
            `Expected error for zero factor with V=${V}, O=${O}`
          );
        }
      ),
      { numRuns: 50 }
    );
  });
});
