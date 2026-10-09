/**
 * CoordinatesSnapshotService
 *
 * Holds an in-memory snapshot of every public entrance as an enriched tuple,
 * [longitude, latitude, size, dataQuality, aestheticism], so the map can
 * filter its low-zoom clusters on the same criteria as its markers. See #1863.
 *
 * The snapshot is loaded from PostgreSQL on server bootstrap and refreshed in
 * the background when the configured TTL expires. Each load also serializes
 * the worldwide response once, to a buffer with its weak ETag, so a worldwide
 * request neither stringifies nor hashes the dataset.
 *
 * For 135,874 entrances on a local copy shaped like production, a load takes
 * about 750 ms: about 550 ms of query, 200 ms to build the columns and 70 ms
 * to serialize. The body is 4.7 MB (1.8 MB gzipped), and the snapshot keeps
 * under 1 MB of heap plus the buffer. Building peaks at about 140 MB of heap,
 * mostly the query rows. A worldwide 200 then takes about 1.6 ms of handler
 * CPU and a 304 under 0.1 ms, against about 29 ms each when the pairs were
 * stringified and hashed per request.
 *
 * A failed load leaves the published snapshot in service and blocks automatic
 * attempts for coordinatesSnapshotRetryDelay seconds; invalidate() ignores
 * that delay. Until a first load succeeds, the controller awaits one per
 * request (ensureLoaded) and falls back to the database in between.
 *
 * State is stored in module-level variables (not on the exported object)
 * so that Sails' _.bindAll() cannot interfere with it.
 */

const etag = require('etag');
const GeoLocService = require('./GeoLocService');
const {
  getCaveSize,
  roundAestheticism,
  getEntranceDataQuality,
  getDateCutoffs,
} = require('../utils/entranceMapCriteria');

// --------------- State ---------------

// { lng, lat, size, quality, interest, length, body, etag, refreshedAt },
// replaced by a single assignment so that no reader can see new columns with
// an old buffer, or the reverse.
let snapshot = null;
let loadPromise = null;
// Date.now() of the last failed load, or null once a load succeeds.
let lastFailedAt = null;
// The one extra load queued by invalidate() while a load is running.
let followUpPromise = null;

// --------------- Helpers ---------------

const getTTL = () => sails.config.custom?.coordinatesSnapshotTTL ?? 86400;

const getRetryDelay = () =>
  sails.config.custom?.coordinatesSnapshotRetryDelay ?? 300;

const isWorldwide = (swLat, swLng, neLat, neLng) =>
  swLat <= -90 && neLat >= 90 && swLng <= -180 && neLng >= 180;

// Columns rather than one small array per entrance: typed arrays take about
// 3.5 MB for 136k entrances, and the old and new snapshots coexist during a
// refresh. A Float64Array holds the same double as Number(row.longitude), so
// precision is unchanged. NaN stands for a null interest.
const buildColumns = (rows) => {
  const { length } = rows;
  const cols = {
    lng: new Float64Array(length),
    lat: new Float64Array(length),
    size: new Uint8Array(length),
    quality: new Uint8Array(length),
    interest: new Float64Array(length),
    length,
  };
  const cutoffs = getDateCutoffs();
  for (let i = 0; i < length; i += 1) {
    const row = rows[i];
    cols.lng[i] = Number(row.longitude);
    cols.lat[i] = Number(row.latitude);
    cols.size[i] = getCaveSize(row.depth, row.length);
    cols.quality[i] = getEntranceDataQuality(row, cutoffs);
    cols.interest[i] = roundAestheticism(row.aestheticism) ?? NaN;
  }
  return cols;
};

const toTuple = (cols, i) => [
  cols.lng[i],
  cols.lat[i],
  cols.size[i],
  cols.quality[i],
  Number.isNaN(cols.interest[i]) ? null : cols.interest[i],
];

// The same text JSON.stringify gives for the tuples: a finite double converts
// to the same string through a template literal as through JSON.stringify.
const serializeTuple = (cols, i) => {
  const interest = cols.interest[i];
  return `[${cols.lng[i]},${cols.lat[i]},${cols.size[i]},${cols.quality[i]},${
    Number.isNaN(interest) ? 'null' : interest
  }]`;
};

/**
 * @param {Object} cols the snapshot columns
 * @param {number[]} [indices] the entries to serialize, all when omitted
 * @returns {string} the JSON array of their tuples
 */
const serialize = (cols, indices) => {
  const parts = indices
    ? indices.map((i) => serializeTuple(cols, i))
    : Array.from({ length: cols.length }, (_, i) => serializeTuple(cols, i));
  return `[${parts.join(',')}]`;
};

// --------------- Service ---------------

const load = () => {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const startTime = Date.now();
    try {
      const rows = await GeoLocService.getAllPublicEntranceCriteriaRows();
      const cols = buildColumns(rows);
      const body = Buffer.from(serialize(cols), 'utf8');
      snapshot = {
        ...cols,
        body,
        // The call Express's default `etag fn` makes, so a client holding an
        // ETag from res.json() keeps getting 304s.
        etag: etag(body, { weak: true }),
        refreshedAt: new Date(Date.now()),
      };
      lastFailedAt = null;
      const elapsed = Date.now() - startTime;
      sails.log.info(
        `CoordinatesSnapshot loaded ${cols.length} entrances (${body.length} bytes) in ${elapsed}ms`
      );
    } catch (err) {
      const elapsed = Date.now() - startTime;
      sails.log.error(
        `CoordinatesSnapshotService.load() failed after ${elapsed}ms:`,
        err
      );
      lastFailedAt = Date.now();
      throw err;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
};

const canRetry = () =>
  lastFailedAt === null || Date.now() - lastFailedAt >= getRetryDelay() * 1000;

const isDue = () =>
  snapshot === null ||
  Date.now() - snapshot.refreshedAt.getTime() > getTTL() * 1000;

// Stale-while-revalidate: called by every read accessor, never blocks it.
const maybeRefresh = () => {
  if (isDue() && canRetry() && !loadPromise) {
    sails.log.info(
      'CoordinatesSnapshot TTL expired, triggering background refresh'
    );
    load().catch(() => {});
  }
};

module.exports = {
  load,

  isWorldwide,

  isLoaded: () => snapshot !== null,

  getLastRefreshedAt: () => snapshot?.refreshedAt ?? null,

  getTTL,

  getRetryDelay,

  /**
   * Awaits the running load, or starts one if the retry delay allows.
   * @returns {Promise<boolean>} whether a snapshot is loaded; never rejects
   */
  async ensureLoaded() {
    if (snapshot !== null) return true;
    if (loadPromise) {
      await loadPromise.catch(() => {});
    } else if (canRetry()) {
      await load().catch(() => {});
    }
    return snapshot !== null;
  },

  /**
   * @returns {{ body: Buffer, etag: string }|null} the prebuilt worldwide
   *   response, not a copy
   */
  getWorldResponse() {
    maybeRefresh();
    if (snapshot === null) return null;
    return { body: snapshot.body, etag: snapshot.etag };
  },

  getCoordinates(swLat, swLng, neLat, neLng) {
    maybeRefresh();
    if (snapshot === null) return null;
    const cols = snapshot;

    // Strict inequalities (>) are intentional: coordinates exactly on the bbox
    // boundary are excluded to match Leaflet's convention where tile edges
    // belong to the adjacent tile, avoiding duplicate markers.
    //
    // The fullLat / fullLng special cases use inclusive (>=, <=) bounds because
    // they represent the full geographic range (±90° lat or ±180° lng). There is
    // no adjacent tile beyond these limits, so boundary exclusion is unnecessary.
    const fullLat = swLat <= -90 && neLat >= 90;
    const fullLng = swLng <= -180 && neLng >= 180;

    let isInside;
    if (fullLat && fullLng) isInside = () => true;
    else if (fullLat) {
      isInside = (i) => cols.lng[i] >= swLng && cols.lng[i] <= neLng;
    } else if (fullLng) {
      isInside = (i) => cols.lat[i] >= swLat && cols.lat[i] <= neLat;
    } else {
      isInside = (i) =>
        cols.lng[i] > swLng &&
        cols.lng[i] < neLng &&
        cols.lat[i] > swLat &&
        cols.lat[i] < neLat;
    }

    const result = [];
    for (let i = 0; i < cols.length; i += 1) {
      if (isInside(i)) result.push(toTuple(cols, i));
    }
    return result;
  },

  /**
   * Reloads regardless of the retry delay. While a load is running, that load
   * may have read the database before the caller's rows were committed, so
   * one follow-up load is queued after it instead, shared by every
   * invalidate() made in the meantime: a burst of CSV chunks causes at most
   * two loads. load()'s `finally` clears loadPromise before the follow-up
   * starts, so the follow-up runs a new query.
   *
   * @returns {Promise<void>} settles with the load that will include the
   *   caller's committed rows
   */
  invalidate() {
    sails.log.info(
      'CoordinatesSnapshot invalidated, triggering background refresh'
    );
    // The snapshot stays published, so the controller keeps computing a
    // correct (increasing) Cache-Control age while the refresh runs.
    if (!loadPromise) return load();
    if (!followUpPromise) {
      followUpPromise = loadPromise
        .catch(() => {}) // the follow-up runs whatever the outcome
        .then(() => {
          followUpPromise = null; // a later invalidate() queues the next one
          return load();
        });
    }
    return followUpPromise;
  },

  // Exposed for tests
  serialize,

  // Test helper — not for production use
  reset() {
    snapshot = null;
    loadPromise = null;
    lastFailedAt = null;
    followUpPromise = null;
  },
};
