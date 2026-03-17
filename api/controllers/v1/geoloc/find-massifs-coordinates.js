const MassifCoordinatesSnapshotService = require('../../../services/MassifCoordinatesSnapshotService');
const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  try {
    // Try snapshot first
    let result = MassifCoordinatesSnapshotService.getCoordinates(
      parseFloat(southWestBound.lat),
      parseFloat(southWestBound.lng),
      parseFloat(northEastBound.lat),
      parseFloat(northEastBound.lng)
    );

    if (result === null) {
      // Snapshot not loaded yet — fallback to DB query
      sails.log.info(
        'MassifCoordinatesSnapshot not loaded yet, falling back to DB query'
      );
      result = await GeoLocService.getMassifsCoordinates(
        southWestBound,
        northEastBound
      );
    }

    // Cache-Control header for successful responses.
    // When lastRefreshed is null (snapshot not yet loaded), emit max-age=0
    // to prevent CDNs from caching a DB-fallback response for the full TTL.
    const lastRefreshed = MassifCoordinatesSnapshotService.getLastRefreshedAt();
    const ttl = MassifCoordinatesSnapshotService.getTTL();
    if (lastRefreshed) {
      const age = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      res.set('Cache-Control', `public, max-age=${Math.max(ttl - age, 0)}`);
    } else {
      res.set('Cache-Control', 'public, max-age=0');
    }

    return res.json(result);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
