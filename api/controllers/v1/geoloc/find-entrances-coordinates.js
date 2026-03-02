const CoordinatesSnapshotService = require('../../../services/CoordinatesSnapshotService');
const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  const { massifId, errorResponse } =
    await GeoLocService.checkAndGetMassifParam(req, res);
  if (errorResponse) return errorResponse;

  try {
    let result;

    if (massifId) {
      // Massif requests bypass the snapshot (AC 1.4)
      result = await GeoLocService.getEntrancesCoordinates(
        southWestBound,
        northEastBound,
        100000,
        massifId
      );
    } else {
      // Try snapshot first (AC 1.2)
      result = CoordinatesSnapshotService.getCoordinates(
        parseFloat(southWestBound.lat),
        parseFloat(southWestBound.lng),
        parseFloat(northEastBound.lat),
        parseFloat(northEastBound.lng)
      );

      if (result === null) {
        // Snapshot not loaded yet — fallback (AC 1.3)
        sails.log.info(
          'CoordinatesSnapshot not loaded yet, falling back to DB query'
        );
        result = await GeoLocService.getEntrancesCoordinates(
          southWestBound,
          northEastBound,
          100000
        );
      }
    }

    // Cache-Control header for all successful responses (AC 4.1)
    const lastRefreshed = CoordinatesSnapshotService.getLastRefreshedAt();
    const ttl = CoordinatesSnapshotService.getTTL();
    const age = lastRefreshed
      ? Math.floor((Date.now() - lastRefreshed.getTime()) / 1000)
      : 0;
    res.set('Cache-Control', `public, max-age=${Math.max(ttl - age, 0)}`);

    return res.json(result);
  } catch (e) {
    // No Cache-Control on errors (AC 4.2)
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
