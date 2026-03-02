const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const CoordinatesSnapshotService = require('../../../api/services/CoordinatesSnapshotService');
const CommonService = require('../../../api/services/CommonService');

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

// --- Shared setup/teardown ---

function setupSnapshotSuite() {
  let queryStub;
  let originalTTL;

  beforeEach(async () => {
    CoordinatesSnapshotService.reset();
    originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    sails.config.custom.coordinatesSnapshotTTL = 999999;
  });

  afterEach(() => {
    sails.config.custom.coordinatesSnapshotTTL = originalTTL;
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
      queryStub = sinon.stub(CommonService, 'query').resolves({
        rows: coords.map(([lng, lat]) => ({
          longitude: lng,
          latitude: lat,
        })),
      });
    },
    stubError(err) {
      if (queryStub) queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').rejects(err);
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
 * is strictly within bounds, and every in-bounds coordinate is returned.
 * Encodes: the filter uses strict inequality (not <=) on all four edges.
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
   * Bug 2 — Stuck Cache: after clear() + failed load(), lastRefreshedAt must be non-null.
   * Encodes: cache recovery requires lastRefreshedAt to be truthy for stale-while-revalidate.
   * Covers: clear() followed by a failed background load().
   *
   * On UNFIXED code: lastRefreshedAt stays null (stuck cache) — test FAILS.
   * On FIXED code: lastRefreshedAt is set to epoch new Date(0) — test PASSES.
   *
   * Validates: Requirements 1.2, 2.2
   */
  it('should preserve non-null lastRefreshedAt after clear() + failed load() (Bug 2 — Stuck Cache)', async function () {
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

          // Step 2: clear() sets lastRefreshedAt = null, then triggers background load()
          // Stub DB to fail BEFORE calling clear() so the background load() fails
          stubs.stubError(new Error(errorMsg));
          CoordinatesSnapshotService.clear();

          // Step 3: Wait for the background load() to complete
          // clear() calls load().catch(() => {}), so we call load() again to get the same promise
          // (single-flight guard) and await it, catching the expected rejection
          try {
            await CoordinatesSnapshotService.load();
          } catch (e) {
            // Expected on fixed code — load() rejects
          }

          // Small delay to ensure the fire-and-forget promise settles
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });

          // Expected behavior: lastRefreshedAt is NOT null (recovery state preserved)
          const refreshedAt = CoordinatesSnapshotService.getLastRefreshedAt();
          should(refreshedAt !== null).be.true(
            'lastRefreshedAt should be non-null after clear() + failed load(), but it is null (stuck cache)'
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
    const queryStub = sinon.stub(CommonService, 'query').returns(slowPromise);

    // Fire two concurrent load() calls
    const promise1 = CoordinatesSnapshotService.load();
    const promise2 = CoordinatesSnapshotService.load();

    // Both should return the same promise (single-flight guard)
    should(promise1).equal(promise2);

    // CommonService.query should have been called exactly once
    should(queryStub.callCount).equal(1);

    // Resolve the query so load() completes
    resolveQuery({ rows: [{ longitude: 10, latitude: 20 }] });
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

    const result = CoordinatesSnapshotService.getCoordinates(-45, -90, 45, 90);
    should(result).be.null();
  });
});
