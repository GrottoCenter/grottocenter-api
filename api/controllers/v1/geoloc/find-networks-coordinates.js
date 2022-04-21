const ErrorService = require('../../../services/ErrorService');
const GeoLocService = require('../../../services/GeoLocService');

module.exports = async (req, res) => {
  const { southWestBound, northEastBound, errorMessage } =
    GeoLocService.checkAndGetCoordinatesParams(req);

  if (errorMessage !== '') return res.badRequest(errorMessage);

  try {
    const result = await GeoLocService.getNetworksCoordinates(
      southWestBound,
      northEastBound,
      100000
    );
    return res.json(result);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
