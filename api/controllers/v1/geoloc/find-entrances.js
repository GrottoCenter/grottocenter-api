const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  // Before the massif lookup on purpose: this is arithmetic, that is a database
  // round trip, and a size guard that pays for I/O before rejecting defeats
  // itself. As a result an oversized box reports the area problem even when
  // ?massif points at an unknown id.
  const bboxError = GeoLocService.validateBoundingBoxArea(
    southWestBound,
    northEastBound
  );
  if (bboxError) return res.badRequest(bboxError);

  const { massifId, errorResponse } =
    await GeoLocService.checkAndGetMassifParam(req, res);
  if (errorResponse) return errorResponse;

  try {
    const result = await GeoLocService.getEntrancesMap(
      southWestBound,
      northEastBound,
      100000,
      massifId
    );
    return res.json(result);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
