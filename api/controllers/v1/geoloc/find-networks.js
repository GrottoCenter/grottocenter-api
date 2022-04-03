const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  try {
    const result = await GeoLocService.getNetworksMap(
      southWestBound,
      northEastBound
    );
    return res.json(result);
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};