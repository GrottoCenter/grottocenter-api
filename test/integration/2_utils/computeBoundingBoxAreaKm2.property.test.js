/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const computeBoundingBoxAreaKm2 = require('../../../api/utils/computeBoundingBoxAreaKm2');

const EARTH_RADIUS_KM = 6371.0088;
const WHOLE_EARTH_KM2 = 4 * Math.PI * EARTH_RADIUS_KM * EARTH_RADIUS_KM;

const latArb = fc.double({ min: -90, max: 90, noNaN: true });
const lngArb = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Arbitrary: a normalised bounding box, south-west corner first.
 *
 * The helper deliberately normalises inverted input itself (mirroring
 * ST_MakeEnvelope), but generating already-ordered corners keeps the geometric
 * properties below stated in the obvious way; Property 6 covers the inverted
 * case separately.
 */
const boxArb = fc
  .tuple(latArb, latArb, lngArb, lngArb)
  .map(([latA, latB, lngA, lngB]) => ({
    sw: { lat: Math.min(latA, latB), lng: Math.min(lngA, lngB) },
    ne: { lat: Math.max(latA, latB), lng: Math.max(lngA, lngB) },
  }));

const areaOf = ({ sw, ne }) => computeBoundingBoxAreaKm2(sw, ne);

/** Relative difference, tolerant of the exact-zero degenerate boxes. */
const relDiff = (a, b) => (a === b ? 0 : Math.abs(a - b) / Math.max(a, b));

const toRad = (degrees) => (degrees * Math.PI) / 180;

/**
 * How much the area computation amplifies a rounding error in its inputs.
 *
 * The latitude factor goes through `cos((φ₁+φ₂)/2)`, and cos loses relative
 * accuracy in proportion to `tan` of its argument: d(cos x)/cos x = −tan(x)·dx.
 * Near a pole that multiplier is enormous — `tan(89.99999999999997°)` is
 * 1.4e15 — so half an ulp of rounding in the degrees-to-radians conversion
 * becomes a relative error of order 0.3 in the result. Longitude has no such
 * term, which is why only latitude splits are affected.
 *
 * Floored at 1 so that away from the poles the bound below stays at 1e-9.
 */
const errorAmplification = ({ sw, ne }) =>
  Math.max(
    Math.abs(Math.tan(toRad(sw.lat))),
    Math.abs(Math.tan(toRad(ne.lat))),
    1
  );

/**
 * Assert that two parts sum back to the whole, to the accuracy a double can
 * actually deliver for that box.
 *
 * Asserting a flat 1e-9 relative difference is what made this suite fail for
 * ~2.3% of seeds per axis (#1842). Two distinct degeneracies break it, and
 * neither is a defect in the helper:
 *
 * 1. Subnormal results. A box spanning 8.5e-288 degrees of longitude has an area
 *    of 1.496e-320 km² — 3028 ulps, 11.6 mantissa bits, so the best relative
 *    precision available is 3.3e-4. The observed relDiff was 3.3e-4 exactly and
 *    the parts differed from the whole by a single ulp: as accurate as a double
 *    can be, against a target that was unsatisfiable in principle.
 *
 * 2. Thin boxes at a pole. A box 1.4 ulps of latitude tall at −90° yields a 28%
 *    relative difference, which `Number.EPSILON * errorAmplification` predicts
 *    as 30.5%. Here the area is a perfectly normal 2.4e-259, so a subnormal
 *    check alone does not cover it — the loss is in the conditioning, not the
 *    magnitude.
 *
 * So the bound is absolute near the underflow floor and relative elsewhere,
 * scaled by the conditioning. Both constants are measured over 1.8M generated
 * cases rather than guessed:
 *
 *   absolute floor      worst observed 1.0 ulp          bound 4 ulps
 *   relative, scaled    worst observed 0.277·ε·amp      bound 4·ε·amp
 *
 * Verified to still catch real breakage: swapping sin and cos fails 60/60 seeds,
 * squaring the longitude term 55/60, an additive constant 60/60. A constant
 * *factor* is invisible to any additivity test — it scales parts and whole
 * alike — and is covered by Property 3 and the exact 4πR² unit test instead.
 */
const shouldBeAdditive = (parts, whole, box) => {
  should(parts).be.a.Number().and.not.NaN();

  const absoluteError = Math.abs(parts - whole);
  const tolerance = Math.max(
    1e-9,
    4 * Number.EPSILON * errorAmplification(box)
  );

  if (absoluteError <= 4 * Number.MIN_VALUE) return; // at the underflow floor
  should(relDiff(parts, whole)).be.belowOrEqual(tolerance);
};

describe('computeBoundingBoxAreaKm2 - Property Tests', () => {
  /**
   * Property 1: Bisection additivity
   *
   * The strongest single property here. Splitting a box along a latitude or a
   * longitude must give two parts that sum back to the whole. Any confusion
   * between sin and cos, or any stray factor, breaks additivity in one axis
   * while leaving plausible-looking magnitudes behind.
   */
  describe('Property 1: Bisection additivity', () => {
    it('should split additively along a latitude', () => {
      fc.assert(
        fc.property(
          boxArb,
          fc.double({ min: 0, max: 1, noNaN: true }),
          (b, t) => {
            const mid = b.sw.lat + t * (b.ne.lat - b.sw.lat);
            const south = areaOf({ sw: b.sw, ne: { lat: mid, lng: b.ne.lng } });
            const north = areaOf({ sw: { lat: mid, lng: b.sw.lng }, ne: b.ne });
            shouldBeAdditive(south + north, areaOf(b), b);
          }
        ),
        { numRuns: 300 }
      );
    });

    it('should split additively along a longitude', () => {
      fc.assert(
        fc.property(
          boxArb,
          fc.double({ min: 0, max: 1, noNaN: true }),
          (b, t) => {
            const mid = b.sw.lng + t * (b.ne.lng - b.sw.lng);
            const west = areaOf({ sw: b.sw, ne: { lat: b.ne.lat, lng: mid } });
            const east = areaOf({ sw: { lat: b.sw.lat, lng: mid }, ne: b.ne });
            shouldBeAdditive(west + east, areaOf(b), b);
          }
        ),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 2: Monotonicity under enclosure
   *
   * Growing a box can never shrink its area. This is the property the cap
   * actually relies on: it is what makes "area exceeds the limit" a meaningful
   * proxy for "this request reads more rows".
   */
  describe('Property 2: Monotonicity under enclosure', () => {
    it('should never report a smaller area for an enclosing box', () => {
      fc.assert(
        fc.property(
          boxArb,
          fc.double({ min: 0, max: 10, noNaN: true }),
          fc.double({ min: 0, max: 10, noNaN: true }),
          (b, growLat, growLng) => {
            const outer = {
              sw: {
                lat: Math.max(-90, b.sw.lat - growLat),
                lng: Math.max(-180, b.sw.lng - growLng),
              },
              ne: {
                lat: Math.min(90, b.ne.lat + growLat),
                lng: Math.min(180, b.ne.lng + growLng),
              },
            };
            should(areaOf(outer)).be.aboveOrEqual(areaOf(b) - 1e-9);
          }
        ),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 3: Bounded by the sphere
   *
   * No box may claim more surface than the planet has. Guards against a missing
   * radian conversion, which would inflate results by a factor of ~57 per axis
   * and silently make the cap reject everything.
   */
  describe('Property 3: Bounded by the sphere', () => {
    it('should stay between zero and the whole sphere', () => {
      fc.assert(
        fc.property(boxArb, (b) => {
          const area = areaOf(b);
          should(area).be.aboveOrEqual(0);
          should(area).be.belowOrEqual(WHOLE_EARTH_KM2 * (1 + 1e-9));
        }),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 4: Longitude linearity
   *
   * Area scales exactly linearly with the longitude span, because meridian
   * spacing does not depend on longitude. Latitude has no such property, so
   * this isolates the two axes from one another.
   */
  describe('Property 4: Longitude linearity', () => {
    it('should scale exactly with the longitude span', () => {
      fc.assert(
        fc.property(
          latArb,
          latArb,
          fc.double({ min: -170, max: 170, noNaN: true }),
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          fc.double({ min: 1, max: 10, noNaN: true }),
          (latA, latB, lng, span, factor) => {
            const sw = { lat: Math.min(latA, latB), lng };
            const single = computeBoundingBoxAreaKm2(sw, {
              lat: Math.max(latA, latB),
              lng: lng + span,
            });
            const scaled = computeBoundingBoxAreaKm2(sw, {
              lat: Math.max(latA, latB),
              lng: lng + span * factor,
            });
            should(relDiff(scaled, single * factor)).be.below(1e-9);
          }
        ),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 5: Hemisphere symmetry
   *
   * A latitude band mirrored across the equator covers the same area. Catches a
   * sign error in the sin difference that would otherwise only show up in one
   * hemisphere.
   */
  describe('Property 5: Hemisphere symmetry', () => {
    it('should give a mirrored band the same area', () => {
      fc.assert(
        fc.property(boxArb, (b) => {
          const mirrored = {
            sw: { lat: -b.ne.lat, lng: b.sw.lng },
            ne: { lat: -b.sw.lat, lng: b.ne.lng },
          };
          should(relDiff(areaOf(mirrored), areaOf(b))).be.below(1e-9);
        }),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 6: Corner-order invariance
   *
   * ST_MakeEnvelope normalises its inputs to min/max, so the helper must agree
   * for every permutation of the corners it is handed.
   */
  describe('Property 6: Corner-order invariance', () => {
    it('should not depend on the order of the corners', () => {
      fc.assert(
        fc.property(boxArb, (b) => {
          const area = areaOf(b);
          should(computeBoundingBoxAreaKm2(b.ne, b.sw)).equal(area);
          should(
            computeBoundingBoxAreaKm2(
              { lat: b.ne.lat, lng: b.sw.lng },
              { lat: b.sw.lat, lng: b.ne.lng }
            )
          ).equal(area);
        }),
        { numRuns: 300 }
      );
    });
  });

  /**
   * Property 7: String and number equivalence
   *
   * Every coordinate arrives as a query-string value in production, so the
   * coerced path is the only one that ever runs against real traffic.
   */
  describe('Property 7: String and number equivalence', () => {
    it('should give numeric strings the same area as numbers', () => {
      fc.assert(
        fc.property(boxArb, (b) => {
          const asStrings = computeBoundingBoxAreaKm2(
            { lat: String(b.sw.lat), lng: String(b.sw.lng) },
            { lat: String(b.ne.lat), lng: String(b.ne.lng) }
          );
          should(asStrings).equal(areaOf(b));
        }),
        { numRuns: 300 }
      );
    });
  });
});
