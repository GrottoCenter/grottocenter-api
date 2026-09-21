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
            should(relDiff(south + north, areaOf(b))).be.below(1e-9);
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
            should(relDiff(west + east, areaOf(b))).be.below(1e-9);
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
