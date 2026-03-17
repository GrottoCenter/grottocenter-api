const should = require('should');
const fc = require('fast-check');
const CommonService = require('../../../api/services/CommonService');

// Feature: db-access-patterns-optimization
// Property 1: Spatial query equivalence for bounding box searches

/**
 * Bounding box arbitrary: generates valid SW/NE coordinate pairs
 * where sw_lat < ne_lat and sw_lng < ne_lng.
 * Uses realistic ranges that overlap with fixture data.
 */
const bboxArb = fc
  .tuple(
    fc.double({ min: -90, max: 89, noNaN: true }),
    fc.double({ min: -180, max: 179, noNaN: true })
  )
  .chain(([swLat, swLng]) =>
    fc
      .tuple(
        fc.double({ min: swLat + 0.01, max: 90, noNaN: true }),
        fc.double({ min: swLng + 0.01, max: 180, noNaN: true })
      )
      .map(([neLat, neLng]) => ({ swLat, swLng, neLat, neLng }))
  );

/**
 * Property 1: Spatial query equivalence for bounding box searches.
 * Encodes: ST_Within(point_geom, ST_MakeEnvelope(...)) returns the same
 * entrance IDs as numeric lat > sw AND lat < ne AND lng > sw AND lng < ne,
 * for entrances with non-null point_geom.
 * Covers: all valid bounding boxes over the fixture entrance data.
 */
describe('GeoLocService - Property 1: spatial query equivalence', () => {
  const OLD_QUERY = `
    SELECT e.id FROM t_entrance AS e
    WHERE e.latitude > $1 AND e.latitude < $2
    AND e.longitude > $3 AND e.longitude < $4
    AND e.is_sensitive = false AND e.is_deleted = false
    AND e.point_geom IS NOT NULL
    ORDER BY e.id
  `;

  const NEW_QUERY = `
    SELECT e.id FROM t_entrance AS e
    WHERE ST_Within(e.point_geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
    AND e.is_sensitive = false AND e.is_deleted = false
    ORDER BY e.id
  `;

  it('should return same entrance IDs with ST_Within as with numeric comparison', async function spatialEquivalence() {
    this.timeout(120000);
    await fc.assert(
      fc.asyncProperty(bboxArb, async ({ swLat, swLng, neLat, neLng }) => {
        const [oldResult, newResult] = await Promise.all([
          CommonService.query(OLD_QUERY, [swLat, neLat, swLng, neLng]),
          CommonService.query(NEW_QUERY, [swLng, swLat, neLng, neLat]),
        ]);

        const oldIds = oldResult.rows.map((r) => r.id);
        const newIds = newResult.rows.map((r) => r.id);

        should(newIds).deepEqual(
          oldIds,
          `Mismatch for bbox sw(${swLat},${swLng}) ne(${neLat},${neLng})`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: massif-geometry-endpoints, Property 2: Centroid exclusion filtering
const GeoLocService = require('../../../api/services/GeoLocService');

/**
 * Bounding box arbitrary for massif centroid tests: generates valid SW/NE
 * coordinate pairs where sw_lat < ne_lat and sw_lng < ne_lng.
 */
const massifBboxArb = fc
  .tuple(
    fc.double({ min: -90, max: 89, noNaN: true }),
    fc.double({ min: -180, max: 179, noNaN: true })
  )
  .chain(([swLat, swLng]) =>
    fc
      .tuple(
        fc.double({ min: swLat + 0.01, max: 90, noNaN: true }),
        fc.double({ min: swLng + 0.01, max: 180, noNaN: true })
      )
      .map(([neLat, neLng]) => ({ swLat, swLng, neLat, neLng }))
  );

/**
 * Property 2: Centroid exclusion filtering.
 * Encodes: For any bounding box query, the number of returned centroids
 * equals the number of non-deleted massifs with non-null geog_polygon
 * whose centroid falls within the bounding box.
 * Covers: all valid bounding boxes over the fixture massif data.
 *
 * Validates: Requirements 1.3, 1.4
 */
describe('GeoLocService - Property 2: centroid exclusion filtering', () => {
  const REFERENCE_COUNT_QUERY = `
    SELECT COUNT(*)::integer AS count
    FROM t_massif
    WHERE is_deleted = false
      AND geog_polygon IS NOT NULL
      AND ST_Within(
        ST_Centroid(geog_polygon::geometry),
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      );
  `;

  it('should return exactly the centroids matching non-deleted massifs with non-null polygons in bbox', async function centroidExclusion() {
    this.timeout(120000);
    await fc.assert(
      fc.asyncProperty(
        massifBboxArb,
        async ({ swLat, swLng, neLat, neLng }) => {
          const southWestBound = { lat: swLat, lng: swLng };
          const northEastBound = { lat: neLat, lng: neLng };

          const [centroids, refResult] = await Promise.all([
            GeoLocService.getMassifsCoordinates(southWestBound, northEastBound),
            CommonService.query(REFERENCE_COUNT_QUERY, [
              swLng,
              swLat,
              neLng,
              neLat,
            ]),
          ]);

          const expectedCount = refResult.rows[0].count;

          should(centroids.length).equal(
            expectedCount,
            `Centroid count mismatch for bbox sw(${swLat},${swLng}) ne(${neLat},${neLng}): got ${centroids.length}, expected ${expectedCount}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
