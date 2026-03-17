/**
 * MassifCoordinatesSnapshotService
 *
 * Holds an in-memory snapshot of all massif centroid coordinates.
 * The snapshot is loaded from PostgreSQL on server bootstrap and
 * refreshed in the background when the configured TTL expires.
 *
 * State is stored in module-level variables (not on the exported object)
 * so that Sails' _.bindAll() cannot interfere with it.
 *
 * NOTE: If load() fails at bootstrap, there is no automatic retry.
 * The DB fallback in the controller will handle requests correctly,
 * but without the snapshot's performance benefit. A server restart
 * is required to restore the in-memory snapshot.
 */

const CommonService = require('./CommonService');

const ALL_MASSIF_CENTROIDS = `
  SELECT
    ST_X(ST_Centroid(m.geog_polygon::geometry)) AS longitude,
    ST_Y(ST_Centroid(m.geog_polygon::geometry)) AS latitude
  FROM t_massif AS m
  WHERE m.is_deleted = false
    AND m.geog_polygon IS NOT NULL;
`;

// --------------- State ---------------

let coordinates = null;
let lastRefreshedAt = null;
let loadPromise = null;

// --------------- Helpers ---------------

const getTTL = () => sails.config.custom?.coordinatesSnapshotTTL ?? 86400;

// --------------- Service ---------------

const load = () => {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const startTime = Date.now();
    try {
      const results = await CommonService.query(ALL_MASSIF_CENTROIDS);
      coordinates = results.rows.map((row) => [
        Number(row.longitude),
        Number(row.latitude),
      ]);
      lastRefreshedAt = new Date();
      const elapsed = Date.now() - startTime;
      sails.log.info(
        `MassifCoordinatesSnapshot loaded ${coordinates.length} coordinates in ${elapsed}ms`
      );
    } catch (err) {
      const elapsed = Date.now() - startTime;
      sails.log.error(
        `MassifCoordinatesSnapshotService.load() failed after ${elapsed}ms:`,
        err
      );
      lastRefreshedAt = lastRefreshedAt || new Date(0);
      throw err;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
};

module.exports = {
  load,

  isLoaded: () => coordinates !== null,

  getLastRefreshedAt: () => lastRefreshedAt,

  getTTL,

  getCoordinates(swLat, swLng, neLat, neLng) {
    if (coordinates === null) return null;

    // Stale-while-revalidate: trigger background refresh if TTL expired
    if (
      lastRefreshedAt &&
      Date.now() - lastRefreshedAt.getTime() > getTTL() * 1000 &&
      !loadPromise
    ) {
      sails.log.info(
        'MassifCoordinatesSnapshot TTL expired, triggering background refresh'
      );
      load().catch(() => {});
    }

    // Strict inequalities (>) are intentional: coordinates exactly on the bbox
    // boundary are excluded to match Leaflet's convention where tile edges
    // belong to the adjacent tile, avoiding duplicate markers.
    //
    // The fullLat / fullLng special cases use inclusive (>=, <=) bounds because
    // they represent the full geographic range (±90° lat or ±180° lng). There is
    // no adjacent tile beyond these limits, so boundary exclusion is unnecessary.
    const fullLat = swLat <= -90 && neLat >= 90;
    const fullLng = swLng <= -180 && neLng >= 180;

    if (fullLat && fullLng) return coordinates.slice();

    if (fullLat) {
      return coordinates.filter(
        (coord) => coord[0] >= swLng && coord[0] <= neLng
      );
    }

    if (fullLng) {
      return coordinates.filter(
        (coord) => coord[1] >= swLat && coord[1] <= neLat
      );
    }

    return coordinates.filter(
      (coord) =>
        coord[0] > swLng &&
        coord[0] < neLng &&
        coord[1] > swLat &&
        coord[1] < neLat
    );
  },

  invalidate() {
    sails.log.info(
      'MassifCoordinatesSnapshot TTL invalidated, triggering background refresh'
    );
    // Keep lastRefreshedAt at its previous value so the controller computes
    // a correct (increasing) Cache-Control age while the refresh runs.
    load().catch(() => {});
  },

  // Test helper — not for production use
  reset() {
    coordinates = null;
    lastRefreshedAt = null;
    loadPromise = null;
  },
};
