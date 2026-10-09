/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const etag = require('etag');
const CoordinatesSnapshotService = require('../../../api/services/CoordinatesSnapshotService');
const GeoLocService = require('../../../api/services/GeoLocService');

// --- Shared arbitraries ---

// Array of [lng, lat] coordinate pairs
const coordArb = fc.array(
  fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
  ),
  { minLength: 0, maxLength: 100 }
);

// Valid bounding box where sw < ne for both dimensions.
// Lat and lng pairs are independent, so we generate them with fc.tuple + .map
// rather than nested .chain() calls, preserving shrinkability.
const bboxArb = fc
  .tuple(
    fc
      .double({ min: -90, max: 89, noNaN: true, noDefaultInfinity: true })
      .chain((swLat) =>
        fc
          .double({
            min: swLat + 0.01,
            max: 90,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .map((neLat) => [swLat, neLat])
      ),
    fc
      .double({ min: -180, max: 179, noNaN: true, noDefaultInfinity: true })
      .chain((swLng) =>
        fc
          .double({
            min: swLng + 0.01,
            max: 180,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .map((neLng) => [swLng, neLng])
      )
  )
  .map(([[swLat, neLat], [swLng, neLng]]) => ({ swLat, swLng, neLat, neLng }));

// Criteria columns attached to the generated coordinates, cycled by index, with
// the tuple tail each must produce: one per size, rated and unrated, with and
// without quality data. A fresh general category with two contributors scores
// round(14 / 98 * 100) = 14.
const CRITERIA = [
  { row: { depth: 150, length: null, aestheticism: 7.65 }, tail: [3, 0, 7.7] },
  { row: { depth: 30, length: 10, aestheticism: null }, tail: [2, 0, null] },
  {
    row: {
      depth: null,
      length: null,
      aestheticism: '4',
      general_latest_date_of_update: new Date(),
      general_nb_contributions: 2,
    },
    tail: [1, 14, 4],
  },
  { row: { depth: 0, length: 1000 }, tail: [3, 0, null] },
];

const expectedTuple = ([lng, lat], i) => [
  lng,
  lat,
  ...CRITERIA[i % CRITERIA.length].tail,
];

// --- Shared setup/teardown ---

function setupSnapshotSuite() {
  let queryStub;
  let originalTTL;
  let originalRetryDelay;

  beforeEach(async () => {
    CoordinatesSnapshotService.reset();
    originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    originalRetryDelay = sails.config.custom.coordinatesSnapshotRetryDelay;
    sails.config.custom.coordinatesSnapshotTTL = 999999;
  });

  afterEach(() => {
    sails.config.custom.coordinatesSnapshotTTL = originalTTL;
    sails.config.custom.coordinatesSnapshotRetryDelay = originalRetryDelay;
    CoordinatesSnapshotService.reset();
    if (queryStub) {
      queryStub.restore();
      queryStub = null;
    }
    sinon.restore();
  });

  // Returns helpers for stub management inside property runs
  return {
    stubCoords(coords) {
      if (queryStub) queryStub.restore();
      queryStub = sinon
        .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
        .resolves(
          coords.map(([lng, lat], i) => ({
            longitude: lng,
            latitude: lat,
            ...CRITERIA[i % CRITERIA.length].row,
          }))
        );
    },
    stubError(err) {
      if (queryStub) queryStub.restore();
      queryStub = sinon
        .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
        .rejects(err);
    },
    releaseStub() {
      if (queryStub) {
        queryStub.restore();
        queryStub = null;
      }
    },
  };
}

/**
 * Bounding box filter is both sound and complete: every returned coordinate
 * is strictly within bounds, and every in-bounds coordinate is returned, as
 * its full enriched tuple, in snapshot order.
 * Encodes: the filter uses strict inequality (not <=) on all four edges, and
 * filtering never separates an entrance from its criteria.
 * Covers: arbitrary coordinate sets with arbitrary valid bounding boxes.
 */
describe('CoordinatesSnapshotService - Property: Bounding Box Filter Correctness', () => {
  const stubs = setupSnapshotSuite();

  it('should include exactly the coordinates within the bounding box (strict inequality)', async () => {
    await fc.assert(
      fc.asyncProperty(coordArb, bboxArb, async (coords, bbox) => {
        stubs.stubCoords(coords);
        await CoordinatesSnapshotService.load();
        stubs.releaseStub();

        const result = CoordinatesSnapshotService.getCoordinates(
          bbox.swLat,
          bbox.swLng,
          bbox.neLat,
          bbox.neLng
        );

        const fullLat = bbox.swLat <= -90 && bbox.neLat >= 90;
        const fullLng = bbox.swLng <= -180 && bbox.neLng >= 180;

        const isExpected = (() => {
          if (fullLat && fullLng) return () => true;
          if (fullLat) {
            return ([lng]) => lng >= bbox.swLng && lng <= bbox.neLng;
          }
          if (fullLng) {
            return ([, lat]) => lat >= bbox.swLat && lat <= bbox.neLat;
          }
          return ([lng, lat]) =>
            lng > bbox.swLng &&
            lng < bbox.neLng &&
            lat > bbox.swLat &&
            lat < bbox.neLat;
        })();
        should(result).eql(
          coords.map(expectedTuple).filter((tuple, i) => isExpected(coords[i]))
        );

        if (fullLat && fullLng) {
          // Shortcut returns all coordinates
          should(result.length).equal(coords.length);
        } else if (fullLat) {
          // Non-strict longitude filter (>=, <=)
          result.forEach(([lng]) => {
            should(lng).be.aboveOrEqual(bbox.swLng);
            should(lng).be.belowOrEqual(bbox.neLng);
          });
          const expected = coords.filter(
            ([lng]) => lng >= bbox.swLng && lng <= bbox.neLng
          );
          should(result.length).equal(expected.length);
        } else if (fullLng) {
          // Non-strict latitude filter (>=, <=)
          result.forEach(([, lat]) => {
            should(lat).be.aboveOrEqual(bbox.swLat);
            should(lat).be.belowOrEqual(bbox.neLat);
          });
          const expected = coords.filter(
            ([, lat]) => lat >= bbox.swLat && lat <= bbox.neLat
          );
          should(result.length).equal(expected.length);
        } else {
          // Strict inequality on all four edges
          result.forEach(([lng, lat]) => {
            should(lat).be.above(bbox.swLat);
            should(lat).be.below(bbox.neLat);
            should(lng).be.above(bbox.swLng);
            should(lng).be.below(bbox.neLng);
          });
          const expected = coords.filter(
            ([lng, lat]) =>
              lng > bbox.swLng &&
              lng < bbox.neLng &&
              lat > bbox.swLat &&
              lat < bbox.neLat
          );
          should(result.length).equal(expected.length);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Full-range latitude makes the latitude check a no-op: result equals
 * filtering by longitude only.
 * Encodes: the optimization that skips latitude comparison at world bounds.
 * Covers: bounding boxes where swLat = -90 and neLat = 90.
 */
describe('CoordinatesSnapshotService - Property: Full-Range Latitude Skip', () => {
  const stubs = setupSnapshotSuite();

  it('should skip latitude filtering when lat range covers -90 to +90', async () => {
    // Full-range latitude bbox: only longitude varies
    const fullLatBboxArb = fc
      .double({ min: -180, max: 179, noNaN: true, noDefaultInfinity: true })
      .chain((swLng) =>
        fc
          .double({
            min: swLng + 0.01,
            max: 180,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .map((neLng) => ({ swLat: -90, swLng, neLat: 90, neLng }))
      );

    await fc.assert(
      fc.asyncProperty(coordArb, fullLatBboxArb, async (coords, bbox) => {
        stubs.stubCoords(coords);
        await CoordinatesSnapshotService.load();
        stubs.releaseStub();

        const result = CoordinatesSnapshotService.getCoordinates(
          bbox.swLat,
          bbox.swLng,
          bbox.neLat,
          bbox.neLng
        );

        // Result should equal filtering only by longitude (non-strict, matching fullLat path)
        const expected = coords.filter(
          ([lng]) => lng >= bbox.swLng && lng <= bbox.neLng
        );
        should(result.length).equal(expected.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Full-range longitude makes the longitude check a no-op: result equals
 * filtering by latitude only.
 * Encodes: the optimization that skips longitude comparison at world bounds.
 * Covers: bounding boxes where swLng = -180 and neLng = 180.
 */
describe('CoordinatesSnapshotService - Property: Full-Range Longitude Skip', () => {
  const stubs = setupSnapshotSuite();

  it('should skip longitude filtering when lng range covers -180 to +180', async () => {
    // Full-range longitude bbox: only latitude varies
    const fullLngBboxArb = fc
      .double({ min: -90, max: 89, noNaN: true, noDefaultInfinity: true })
      .chain((swLat) =>
        fc
          .double({
            min: swLat + 0.01,
            max: 90,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .map((neLat) => ({ swLat, swLng: -180, neLat, neLng: 180 }))
      );

    await fc.assert(
      fc.asyncProperty(coordArb, fullLngBboxArb, async (coords, bbox) => {
        stubs.stubCoords(coords);
        await CoordinatesSnapshotService.load();
        stubs.releaseStub();

        const result = CoordinatesSnapshotService.getCoordinates(
          bbox.swLat,
          bbox.swLng,
          bbox.neLat,
          bbox.neLng
        );

        // Result should equal filtering only by latitude (non-strict, matching fullLng path)
        const expected = coords.filter(
          ([, lat]) => lat >= bbox.swLat && lat <= bbox.neLat
        );
        should(result.length).equal(expected.length);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// FAULT CONDITION EXPLORATION TESTS
// These tests encode the EXPECTED (correct) behavior.
// They MUST FAIL on unfixed code — failure confirms the bugs exist.
// =============================================================================

describe('CoordinatesSnapshotService - Property 1: Fault Condition', () => {
  const stubs = setupSnapshotSuite();

  /**
   * Bug 1 — Error Propagation: load() must reject when DB query fails.
   * Encodes: errors must propagate so callers (bootstrap .catch()) can observe them.
   * Covers: any DB error during load().
   *
   * On UNFIXED code: load() resolves successfully (error swallowed) — test FAILS.
   * On FIXED code: load() rejects with the error — test PASSES.
   *
   * Validates: Requirements 1.1, 2.1
   */
  it('should reject when load() encounters a DB error (Bug 1 — Error Propagation)', async function () {
    this.timeout(30000);
    const logStub = sinon.stub(sails.log, 'error');

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (errorMsg) => {
          CoordinatesSnapshotService.reset();
          const dbError = new Error(errorMsg);
          stubs.stubError(dbError);

          let rejected = false;
          let caughtError = null;
          try {
            await CoordinatesSnapshotService.load();
          } catch (err) {
            rejected = true;
            caughtError = err;
          }

          // Expected behavior: load() rejects with the DB error
          should(rejected).be.true(
            'load() should reject when DB query fails, but it resolved successfully (error swallowed)'
          );
          should(caughtError).equal(dbError);
        }
      ),
      { numRuns: 20 }
    );

    logStub.restore();
  });

  /**
   * Bug 2 — Stuck Cache: after invalidate() + failed load(), lastRefreshedAt must be non-null.
   * Encodes: a failed reload keeps the published snapshot, and with it
   * lastRefreshedAt, so the controller keeps serving it with a correct age.
   * Covers: invalidate() followed by a failed load().
   *
   * Validates: Requirements 1.2, 2.2
   */
  it('should preserve non-null lastRefreshedAt after invalidate() + failed load() (Bug 2 — Stuck Cache)', async function () {
    this.timeout(30000);
    const logStub = sinon.stub(sails.log, 'error');

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            fc.double({
              min: -180,
              max: 180,
              noNaN: true,
              noDefaultInfinity: true,
            }),
            fc.double({
              min: -90,
              max: 90,
              noNaN: true,
              noDefaultInfinity: true,
            })
          ),
          { minLength: 1, maxLength: 20 }
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (coords, errorMsg) => {
          CoordinatesSnapshotService.reset();

          // Step 1: Load successfully
          stubs.stubCoords(coords);
          await CoordinatesSnapshotService.load();
          stubs.releaseStub();

          should(CoordinatesSnapshotService.getLastRefreshedAt()).be.a.Date();

          // Step 2: invalidate() reloads; stub the DB to fail first so that load fails
          stubs.stubError(new Error(errorMsg));
          await CoordinatesSnapshotService.invalidate().should.be.rejectedWith(
            errorMsg
          );

          // Expected behavior: lastRefreshedAt is NOT null (recovery state preserved)
          const refreshedAt = CoordinatesSnapshotService.getLastRefreshedAt();
          should(refreshedAt !== null).be.true(
            'lastRefreshedAt should be non-null after invalidate() + failed load(), but it is null (stuck cache)'
          );
        }
      ),
      { numRuns: 20 }
    );

    logStub.restore();
  });

  /**
   * Bug 3 — Boundary Inconsistency: fullLat && fullLng shortcut must produce
   * the same result as strict-inequality filtering.
   * Encodes: all code paths in getCoordinates() must agree on boundary coordinates.
   * Covers: coordinate sets with values at exact geographic boundaries (±90 lat, ±180 lng).
   *
   * On UNFIXED code: shortcut returns coordinates.slice() (includes boundary coords),
   *   but strict-inequality filter excludes them — test FAILS.
   * On FIXED code: both paths produce the same result — test PASSES.
   *
   * Validates: Requirements 1.3, 1.4, 2.3, 2.4
   */
  it('should filter boundary coordinates consistently between shortcut and general path (Bug 3 — Boundary Inconsistency)', async function () {
    this.timeout(30000);

    // Boundary coordinate arbitrary: coordinates at exact geographic extremes
    const boundaryCoordArb = fc.constantFrom(
      [-180, -90],
      [180, 90],
      [-180, 90],
      [180, -90],
      [-180, 45],
      [45, -90],
      [180, 45],
      [45, 90],
      [-180, 0],
      [0, -90],
      [180, 0],
      [0, 90]
    );

    // Mix of boundary and interior coordinates
    const interiorCoordArb = fc.tuple(
      fc.double({
        min: -179.99,
        max: 179.99,
        noNaN: true,
        noDefaultInfinity: true,
      }),
      fc.double({
        min: -89.99,
        max: 89.99,
        noNaN: true,
        noDefaultInfinity: true,
      })
    );

    const mixedCoordsArb = fc
      .tuple(
        fc.array(boundaryCoordArb, { minLength: 1, maxLength: 10 }),
        fc.array(interiorCoordArb, { minLength: 0, maxLength: 10 })
      )
      .map(([boundary, interior]) => [...boundary, ...interior]);

    await fc.assert(
      fc.asyncProperty(mixedCoordsArb, async (coords) => {
        CoordinatesSnapshotService.reset();
        stubs.stubCoords(coords);
        await CoordinatesSnapshotService.load();
        stubs.releaseStub();

        // Full-range bbox triggers the fullLat && fullLng shortcut.
        // The shortcut returns coordinates.slice() (all coords, inclusive).
        const fullResult = CoordinatesSnapshotService.getCoordinates(
          -90,
          -180,
          90,
          180
        );

        // The fullLat-only path (full lat, partial lng) should use
        // non-strict inequalities (>=, <=) on longitude, matching the
        // inclusive semantics of the fullLat && fullLng shortcut.
        const fullLatResult = CoordinatesSnapshotService.getCoordinates(
          -90,
          -180,
          90,
          179.99
        );

        // Reference: non-strict longitude filter (what the fullLat path does after fix)
        const expectedFullLat = coords.filter(
          ([lng]) => lng >= -180 && lng <= 179.99
        );

        // On UNFIXED code: fullLat path uses strict inequality (> / <),
        // so coords at lng = -180 are excluded — but the fullLat && fullLng
        // shortcut includes them. This inconsistency causes the test to FAIL.
        // On FIXED code: fullLat path uses non-strict inequality (>= / <=),
        // so coords at lng = -180 are included — consistent with the shortcut.
        should(fullResult.length).equal(
          coords.length,
          `Full-range shortcut should return all ${coords.length} coords but got ${fullResult.length}`
        );
        should(fullLatResult.length).equal(
          expectedFullLat.length,
          `fullLat path returned ${fullLatResult.length} but non-strict reference returned ${expectedFullLat.length}. ` +
            `Boundary coords at lng = -180 should be included with non-strict inequality.`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// PRESERVATION PROPERTY TESTS
// These tests encode behavior that MUST remain unchanged after the fix.
// They MUST PASS on unfixed code — passing confirms the baseline to preserve.
// =============================================================================

describe('CoordinatesSnapshotService - Property 2: Preservation', () => {
  const stubs = setupSnapshotSuite();

  /**
   * Preservation A — Successful Load: after a successful load(), the service
   * is loaded, lastRefreshedAt is a recent Date, and getCoordinates() returns
   * the loaded coordinates.
   * Encodes: successful load populates cache and timestamp (Req 3.1).
   * Covers: all valid coordinate arrays where DB query succeeds.
   *
   * Validates: Requirements 3.1
   */
  it('should populate cache and set lastRefreshedAt on successful load (Preservation A)', async function () {
    this.timeout(60000);

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            fc.double({
              min: -180,
              max: 180,
              noNaN: true,
              noDefaultInfinity: true,
            }),
            fc.double({
              min: -90,
              max: 90,
              noNaN: true,
              noDefaultInfinity: true,
            })
          ),
          { minLength: 0, maxLength: 20 }
        ),
        async (coords) => {
          CoordinatesSnapshotService.reset();
          const beforeLoad = Date.now();

          stubs.stubCoords(coords);
          await CoordinatesSnapshotService.load();
          stubs.releaseStub();

          const afterLoad = Date.now();

          // isLoaded() must be true after successful load
          should(CoordinatesSnapshotService.isLoaded()).be.true(
            'isLoaded() should return true after successful load()'
          );

          // lastRefreshedAt must be a Date within the load window
          const refreshedAt = CoordinatesSnapshotService.getLastRefreshedAt();
          should(refreshedAt).be.a.Date();
          should(refreshedAt.getTime()).be.aboveOrEqual(beforeLoad);
          should(refreshedAt.getTime()).be.belowOrEqual(afterLoad);

          // getCoordinates with a wide non-extreme bbox should return
          // the interior coordinates (those not at exact boundaries)
          const result = CoordinatesSnapshotService.getCoordinates(
            -89.99,
            -179.99,
            89.99,
            179.99
          );
          should(result).be.an.Array();

          // Verify the result matches strict-inequality filtering
          const expected = coords.filter(
            ([lng, lat]) =>
              lng > -179.99 && lng < 179.99 && lat > -89.99 && lat < 89.99
          );
          should(result.length).equal(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Preservation B — Non-Extreme Bounding Box Filtering: for bboxes that do
   * not trigger fullLat/fullLng shortcuts, filtering matches strict-inequality
   * reference.
   * Encodes: non-extreme bbox filtering is unchanged by the fix (Req 3.3).
   * Covers: bboxes where swLat > -90, neLat < 90, swLng > -180, neLng < 180.
   *
   * Validates: Requirements 3.3
   */
  it('should filter non-extreme bboxes with strict inequalities (Preservation B)', async function () {
    this.timeout(60000);

    // Non-extreme bbox arbitrary: no edge touches geographic extremes
    const nonExtremeBboxArb = fc
      .tuple(
        fc.double({
          min: -89.99,
          max: 89,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: -179.99,
          max: 179,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: -89,
          max: 89.99,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: -179,
          max: 179.99,
          noNaN: true,
          noDefaultInfinity: true,
        })
      )
      .filter(
        ([swLat, swLng, neLat, neLng]) =>
          swLat < neLat &&
          swLng < neLng &&
          swLat > -90 &&
          neLat < 90 &&
          swLng > -180 &&
          neLng < 180
      );

    // Coordinate arbitrary: mix of interior and near-boundary values
    const coordsArb = fc.array(
      fc.tuple(
        fc.double({
          min: -180,
          max: 180,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
      ),
      { minLength: 1, maxLength: 30 }
    );

    await fc.assert(
      fc.asyncProperty(coordsArb, nonExtremeBboxArb, async (coords, bbox) => {
        const [swLat, swLng, neLat, neLng] = bbox;

        CoordinatesSnapshotService.reset();
        stubs.stubCoords(coords);
        await CoordinatesSnapshotService.load();
        stubs.releaseStub();

        const result = CoordinatesSnapshotService.getCoordinates(
          swLat,
          swLng,
          neLat,
          neLng
        );

        // Reference: strict-inequality filter
        const expected = coords.filter(
          ([lng, lat]) =>
            lng > swLng && lng < neLng && lat > swLat && lat < neLat
        );

        should(result.length).equal(
          expected.length,
          `Non-extreme bbox [${swLat},${swLng},${neLat},${neLng}]: ` +
            `got ${result.length} coords, expected ${expected.length}`
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Preservation C — Single-Flight Guard: concurrent load() calls share one
   * DB query.
   * Encodes: the single-flight guard prevents duplicate queries (Req 3.2).
   * Covers: two concurrent load() calls.
   *
   * Validates: Requirements 3.2
   */
  it('should execute only one DB query for concurrent load() calls (Preservation C)', async function () {
    this.timeout(30000);

    CoordinatesSnapshotService.reset();

    // Stub with a slow-resolving promise to ensure both calls overlap
    let resolveQuery;
    const slowPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });
    const queryStub = sinon
      .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
      .returns(slowPromise);

    // Fire two concurrent load() calls
    const promise1 = CoordinatesSnapshotService.load();
    const promise2 = CoordinatesSnapshotService.load();

    // Both should return the same promise (single-flight guard)
    should(promise1).equal(promise2);

    // The query should have run exactly once
    should(queryStub.callCount).equal(1);

    // Resolve the query so load() completes
    resolveQuery([{ longitude: 10, latitude: 20 }]);
    await promise1;

    queryStub.restore();
  });

  /**
   * Preservation D — Null Fallback: getCoordinates() returns null when
   * snapshot is not loaded.
   * Encodes: null fallback allows controller to fall back to direct DB query (Req 3.6).
   * Covers: service state after reset() (coordinates = null).
   *
   * Validates: Requirements 3.6
   */
  it('should return null from getCoordinates() when snapshot is not loaded (Preservation D)', () => {
    CoordinatesSnapshotService.reset();
    // The accessor starts a load; hold it so it cannot reach the database
    sinon
      .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
      .returns(new Promise(() => {}));

    const result = CoordinatesSnapshotService.getCoordinates(-45, -90, 45, 90);
    should(result).be.null();
  });
});

// =============================================================================
// ENRICHED SNAPSHOT AND LIFECYCLE PROPERTIES (#1863)
// =============================================================================

const finiteDouble = (min, max) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true });

// NaN, Infinity and -Infinity, which JSON.stringify writes as null. The
// columns can hold them: an interest overflows to Infinity from one rating of
// 1e308, and Number() gives NaN for an unparseable coordinate.
const nonFinite = fc.constantFrom(NaN, Infinity, -Infinity);
const doubleColumn = (arb) =>
  fc.oneof({ weight: 9, arbitrary: arb }, { weight: 1, arbitrary: nonFinite });

// One enriched tuple as the snapshot holds it. Coordinates span the full
// range, including -0 and the extremes; interest is null or one decimal. Any
// double column is now and then non-finite.
const tupleArb = fc.tuple(
  doubleColumn(finiteDouble(-180, 180)),
  doubleColumn(finiteDouble(-90, 90)),
  fc.integer({ min: 1, max: 3 }),
  fc.integer({ min: 0, max: 100 }),
  fc.option(doubleColumn(fc.integer({ min: 1, max: 100 }).map((n) => n / 10)), {
    nil: null,
  })
);

const toColumns = (tuples) => ({
  lng: Float64Array.from(tuples, (t) => t[0]),
  lat: Float64Array.from(tuples, (t) => t[1]),
  size: Uint8Array.from(tuples, (t) => t[2]),
  quality: Uint8Array.from(tuples, (t) => t[3]),
  interest: Float64Array.from(tuples, (t) => (t[4] === null ? NaN : t[4])),
  length: tuples.length,
});

/**
 * Property: Serialization round-trips
 *
 * For any tuples and any subset of their indices, serialize() produces the
 * same bytes JSON.stringify gives for that subset, so JSON.parse rebuilds it.
 * Encodes: the hand-built JSON is interchangeable with res.json(), including
 * for -0, exponents, null interest and non-finite values, which must come out
 * as null rather than as text JSON.parse rejects.
 * Covers: full-range doubles, NaN and ±Infinity in every double column, every
 * size and quality, rated and unrated.
 *
 * Validates: Requirements 4.4, 5.1
 */
describe('CoordinatesSnapshotService - Property: Serialization round-trips', () => {
  it('should serialize any subset exactly as JSON.stringify does', () => {
    fc.assert(
      fc.property(
        fc.array(tupleArb, { maxLength: 50 }).chain((tuples) =>
          fc.tuple(
            fc.constant(tuples),
            fc.subarray(
              tuples.map((_, i) => i),
              { minLength: 0 }
            )
          )
        ),
        ([tuples, indices]) => {
          const cols = toColumns(tuples);
          const expected = indices.map((i) => tuples[i]);

          const all = CoordinatesSnapshotService.serialize(cols);
          const subset = CoordinatesSnapshotService.serialize(cols, indices);

          should(all).equal(JSON.stringify(tuples));
          should(subset).equal(JSON.stringify(expected));
          should(JSON.parse(subset)).have.length(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property: Publication is atomic
 *
 * Over any sequence of loads, each succeeding with arbitrary rows or failing,
 * the worldwide body always parses to the full-box tuples and carries the
 * ETag of its own bytes; a failure leaves body, ETag and lastRefreshedAt
 * exactly as they were published before it.
 * Encodes: columns, buffer, ETag and timestamp are published together, only
 * after a complete build.
 * Covers: first-load failure (nothing published), failure after success,
 * successive successes with different row counts, empty datasets.
 *
 * Validates: Requirements 5.1, 6.2, 6.3
 */
describe('CoordinatesSnapshotService - Property: Publication is atomic', () => {
  afterEach(() => {
    sinon.restore();
    CoordinatesSnapshotService.reset();
  });

  const rowArb = fc.record({
    longitude: finiteDouble(-180, 180),
    latitude: finiteDouble(-90, 90),
    depth: fc.option(fc.integer({ min: 0, max: 2000 }), { nil: null }),
    length: fc.option(fc.integer({ min: 0, max: 200000 }), { nil: null }),
    aestheticism: fc.option(finiteDouble(0.1, 10), { nil: null }),
  });

  const stepArb = fc.oneof(
    fc.array(rowArb, { maxLength: 15 }).map((rows) => ({ ok: true, rows })),
    fc.constant({ ok: false })
  );

  it('should always publish a body, ETag and timestamp that belong together', async function () {
    this.timeout(60000);
    sinon.stub(sails.log, 'error');
    sinon.stub(sails.log, 'info');

    await fc.assert(
      fc.asyncProperty(
        fc.array(stepArb, { minLength: 1, maxLength: 6 }),
        async (steps) => {
          CoordinatesSnapshotService.reset();
          sails.config.custom.coordinatesSnapshotTTL = 999999;
          // eslint-disable-next-line no-restricted-syntax
          for (const step of steps) {
            // Stub before reading: on an unloaded snapshot the accessor itself
            // starts the load, which load() below then joins.
            const stub = sinon.stub(
              GeoLocService,
              'getAllPublicEntranceCriteriaRows'
            );
            if (step.ok) stub.resolves(step.rows);
            else stub.rejects(new Error('DB down'));
            const before = CoordinatesSnapshotService.getWorldResponse();
            const beforeRefreshedAt =
              CoordinatesSnapshotService.getLastRefreshedAt();

            // eslint-disable-next-line no-await-in-loop
            await CoordinatesSnapshotService.load().catch(() => {});
            stub.restore();

            const after = CoordinatesSnapshotService.getWorldResponse();
            if (!step.ok) {
              should(after?.body).equal(before?.body);
              should(after?.etag).equal(before?.etag);
              should(CoordinatesSnapshotService.getLastRefreshedAt()).equal(
                beforeRefreshedAt
              );
            } else {
              should(JSON.parse(after.body.toString('utf8'))).have.length(
                step.rows.length
              );
            }
            if (after !== null) {
              should(after.etag).equal(etag(after.body, { weak: true }));
              should(after.body.toString('utf8')).equal(
                JSON.stringify(
                  CoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180)
                )
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property: Retry gating
 *
 * For any combination of loaded or not, refresh age, failure age and running
 * load, a read accessor starts a load if and only if the snapshot is due (not
 * loaded, or older than the TTL), no load is running, and the last failure,
 * if any, is at least the retry delay old.
 * Encodes: the TTL is strict (>) and the retry delay inclusive (>=), and a
 * running load or a recent failure always suppresses an automatic attempt.
 * Covers: every partition of the four conditions, with ages pinned on and
 * around both boundaries.
 *
 * Validates: Requirements 6.4, 6.5, 6.6
 */
describe('CoordinatesSnapshotService - Property: Retry gating', () => {
  const TTL_S = 100;
  const RETRY_S = 50;
  const T0 = 1_800_000_000_000;
  let originalTTL;
  let originalRetryDelay;

  beforeEach(() => {
    originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    originalRetryDelay = sails.config.custom.coordinatesSnapshotRetryDelay;
  });

  afterEach(() => {
    sails.config.custom.coordinatesSnapshotTTL = originalTTL;
    sails.config.custom.coordinatesSnapshotRetryDelay = originalRetryDelay;
    sinon.restore();
    CoordinatesSnapshotService.reset();
  });

  // Milliseconds after the failure (or after the load, when nothing failed)
  const elapsedArb = fc.oneof(
    fc.integer({ min: 0, max: 300000 }),
    fc.constantFrom(
      RETRY_S * 1000 - 1,
      RETRY_S * 1000,
      TTL_S * 1000 - 2,
      TTL_S * 1000 - 1,
      TTL_S * 1000
    )
  );

  it('should start a load exactly when due, idle and past the retry delay', async function () {
    this.timeout(60000);
    sinon.stub(sails.log, 'error');
    sinon.stub(sails.log, 'info');

    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        elapsedArb,
        fc.boolean(),
        async (loaded, failed, running, elapsed, viaWorld) => {
          CoordinatesSnapshotService.reset();
          sails.config.custom.coordinatesSnapshotTTL = TTL_S;
          sails.config.custom.coordinatesSnapshotRetryDelay = RETRY_S;
          let now = T0;
          const clock = sinon.stub(Date, 'now').callsFake(() => now);
          const stub = sinon.stub(
            GeoLocService,
            'getAllPublicEntranceCriteriaRows'
          );
          try {
            if (loaded) {
              stub.resolves([{ longitude: 1, latitude: 2 }]);
              await CoordinatesSnapshotService.load();
            }
            // The failure happens 1 ms after the load
            now = T0 + 1;
            if (failed) {
              stub.rejects(new Error('DB down'));
              await CoordinatesSnapshotService.load().catch(() => {});
            }
            if (running) {
              stub.returns(new Promise(() => {}));
              CoordinatesSnapshotService.load();
            }
            stub.reset();
            stub.returns(new Promise(() => {}));

            now = T0 + 1 + elapsed;
            if (viaWorld) CoordinatesSnapshotService.getWorldResponse();
            else CoordinatesSnapshotService.getCoordinates(-10, -10, 10, 10);

            const sinceLoad = now - T0;
            const sinceFailure = now - (T0 + 1);
            const isDue = !loaded || sinceLoad > TTL_S * 1000;
            const mayRetry = !failed || sinceFailure >= RETRY_S * 1000;
            const shouldStart = isDue && mayRetry && !running;

            should(stub.callCount).equal(shouldStart ? 1 : 0);
          } finally {
            clock.restore();
            stub.restore();
          }
        }
      ),
      // No I/O, so cheap; 300 runs make the boundary partitions near-certain
      { numRuns: 300 }
    );
  });
});

/**
 * Property: Invalidations during a load coalesce into one follow-up
 *
 * For any number k of invalidate() calls made while a load is running, and
 * either outcome of that load, exactly one further query runs when k >= 1,
 * and none when k = 0. The further query starts only after the running load
 * has settled, and every invalidate() returns the same promise, which
 * resolves with the follow-up's rows published.
 * Encodes: a load that may predate the caller's commit is never handed back
 * as the caller's refresh, and a burst of invalidations costs one extra load.
 * Covers: k from 0 to 5, running load succeeding or failing.
 *
 * Validates: Requirements 6.6, 6.8, 8.3
 */
describe('CoordinatesSnapshotService - Property: Invalidations during a load coalesce into one follow-up', () => {
  afterEach(() => {
    sinon.restore();
    CoordinatesSnapshotService.reset();
  });

  it('should run exactly one follow-up load after the running one settles', async function () {
    this.timeout(60000);
    sinon.stub(sails.log, 'error');
    sinon.stub(sails.log, 'info');
    const newerRows = [
      { longitude: 1, latitude: 2 },
      { longitude: 3, latitude: 4 },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 5 }),
        fc.boolean(),
        async (k, runningSucceeds) => {
          CoordinatesSnapshotService.reset();
          let release;
          const first = new Promise((resolve, reject) => {
            release = () =>
              runningSucceeds
                ? resolve([{ longitude: 5, latitude: 6 }])
                : reject(new Error('DB down'));
          });
          let runningSettled = false;
          let followUpStartedAfterSettle = null;
          const stub = sinon.stub(
            GeoLocService,
            'getAllPublicEntranceCriteriaRows'
          );
          stub.onFirstCall().returns(first);
          stub.onSecondCall().callsFake(() => {
            followUpStartedAfterSettle = runningSettled;
            return Promise.resolve(newerRows);
          });

          try {
            const running = CoordinatesSnapshotService.load();
            running.then(
              () => {
                runningSettled = true;
              },
              () => {
                runningSettled = true;
              }
            );
            const promises = Array.from({ length: k }, () =>
              CoordinatesSnapshotService.invalidate()
            );
            promises.forEach((p) => should(p).equal(promises[0]));
            should(stub.callCount).equal(1);

            release();
            await running.catch(() => {});
            await Promise.all(promises);
            await new Promise((resolve) => {
              setImmediate(resolve);
            });

            if (k === 0) {
              should(stub.callCount).equal(1);
            } else {
              should(stub.callCount).equal(2);
              should(followUpStartedAfterSettle).be.true();
              should(
                CoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180)
              ).have.length(newerRows.length);
            }
          } finally {
            stub.restore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
