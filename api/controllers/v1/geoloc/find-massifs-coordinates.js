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

    // Cache-Control header for successful responses
    const lastRefreshed =
      MassifCoordinatesSnapshotService.getLastRefreshedAt();
    const ttl = MassifCoordinatesSnapshotService.getTTL();
    const age = lastRefreshed
      ? Math.floor((Date.now() - lastRefreshed.getTime()) / 1000)
      : 0;
    res.set('Cache-Control', `public, max-age=${Math.max(ttl - age, 0)}`);

    return res.json(result);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
