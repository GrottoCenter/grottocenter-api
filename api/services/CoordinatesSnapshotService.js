/**
 * CoordinatesSnapshotService
 *
 * Holds an in-memory snapshot of all public entrance coordinates.
 * The snapshot is loaded from PostgreSQL on server bootstrap and
 * refreshed in the background when the configured TTL expires.
 *
 * State is stored in module-level variables (not on the exported object)
 * so that Sails' _.bindAll() cannot interfere with it.
 */

const CommonService = require('./CommonService');

const ALL_PUBLIC_ENTRANCE_COORDINATES = `
  SELECT e.longitude AS longitude, e.latitude AS latitude
  FROM t_entrance AS e
  WHERE e.is_sensitive = false
    AND e.is_deleted = false;
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
      const results = await CommonService.query(
        ALL_PUBLIC_ENTRANCE_COORDINATES
      );
      coordinates = results.rows.map((row) => [
        Number(row.longitude),
        Number(row.latitude),
      ]);
      lastRefreshedAt = new Date();
      const elapsed = Date.now() - startTime;
      sails.log.info(
        `CoordinatesSnapshot loaded ${coordinates.length} coordinates in ${elapsed}ms`
      );
    } catch (err) {
      const elapsed = Date.now() - startTime;
      sails.log.error(
        `CoordinatesSnapshotService.load() failed after ${elapsed}ms:`,
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
        'CoordinatesSnapshot TTL expired, triggering background refresh'
      );
      load().catch(() => {});
    }

    // Strict inequalities (>) are intentional: coordinates exactly on the bbox
    // boundary are excluded to match Leaflet's convention where tile edges
    // belong to the adjacent tile, avoiding duplicate markers.
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

  clear() {
    sails.log.info(
      'CoordinatesSnapshot cleared, triggering background refresh'
    );
    lastRefreshedAt = null;
    load().catch(() => {});
  },

  // Test helper — not for production use
  reset() {
    coordinates = null;
    lastRefreshedAt = null;
    loadPromise = null;
  },
};
