const CoordinatesSnapshotService = require('../../../services/CoordinatesSnapshotService');
const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

// Cache-Control header for all successful responses (AC 4.1)
// When lastRefreshed is null (snapshot not yet loaded), emit max-age=0
// to prevent CDNs from caching a DB-fallback response for the full TTL.
//
// Computed before the response is chosen, so a snapshot published while the
// fallback query runs cannot give that fallback the snapshot's max-age, but
// set only on success: errors carry no Cache-Control (AC 4.2).
const getCacheControl = () => {
  const lastRefreshed = CoordinatesSnapshotService.getLastRefreshedAt();
  if (!lastRefreshed) return 'public, max-age=0';
  const ttl = CoordinatesSnapshotService.getTTL();
  const age = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
  return `public, max-age=${Math.max(ttl - age, 0)}`;
};

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  const { massifId, errorResponse } =
    await GeoLocService.checkAndGetMassifParam(req, res);
  if (errorResponse) return errorResponse;

  try {
    if (massifId) {
      // Massif requests bypass the snapshot and keep returning
      // [longitude, latitude] pairs (AC 1.4)
      const result = await GeoLocService.getEntrancesCoordinates(
        southWestBound,
        northEastBound,
        100000,
        massifId
      );
      res.set('Cache-Control', getCacheControl());
      return res.json(result);
    }

    // A cold start waits for the full dataset rather than answering at once
    // from the database. ensureLoaded() starts at most one load per retry
    // delay, so a failing database is not queried by every request.
    if (!CoordinatesSnapshotService.isLoaded()) {
      sails.log.info('CoordinatesSnapshot not loaded yet, awaiting load');
      await CoordinatesSnapshotService.ensureLoaded();
    }

    const cacheControl = getCacheControl();

    const swLat = parseFloat(southWestBound.lat);
    const swLng = parseFloat(southWestBound.lng);
    const neLat = parseFloat(northEastBound.lat);
    const neLng = parseFloat(northEastBound.lng);

    // The worldwide body is serialized and hashed once per load. With the
    // ETag preset Express does not hash the buffer, and a matching
    // If-None-Match turns the response into a 304 without a body.
    const world = CoordinatesSnapshotService.isWorldwide(
      swLat,
      swLng,
      neLat,
      neLng
    )
      ? CoordinatesSnapshotService.getWorldResponse()
      : null;
    if (world) {
      res.set('Cache-Control', cacheControl);
      res.set('ETag', world.etag);
      // res.send() would label a Buffer application/octet-stream
      res.set('Content-Type', 'application/json; charset=utf-8');
      return res.send(world.body);
    }

    let result = CoordinatesSnapshotService.getCoordinates(
      swLat,
      swLng,
      neLat,
      neLng
    );
    if (result === null) {
      sails.log.info(
        'CoordinatesSnapshot unavailable, falling back to DB query'
      );
      result = await GeoLocService.getEnrichedEntrancesCoordinates(
        southWestBound,
        northEastBound
      );
    }
    res.set('Cache-Control', cacheControl);
    return res.json(result);
  } catch (e) {
    // No Cache-Control on errors (AC 4.2)
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
