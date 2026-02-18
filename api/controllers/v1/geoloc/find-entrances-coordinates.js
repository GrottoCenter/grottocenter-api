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
    const result = await GeoLocService.getEntrancesCoordinates(
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
