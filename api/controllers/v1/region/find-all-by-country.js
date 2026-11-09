const ControllerService = require('../../../services/ControllerService');
const RegionService = require('../../../services/RegionService');

module.exports = async (req, res) => {
  const { countryId } = req.params;

  try {
    const country = await TCountry.findOne({ id: countryId });
    if (!country) {
      return res.notFound({
        message: `Country with id ${countryId} not found.`,
      });
    }

    const regions = await RegionService.getEntranceCountsByCountry(country.id);
    return ControllerService.treat(
      req,
      null,
      { regions },
      { controllerMethod: 'RegionController.find-all-by-country' },
      res
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred when getting the regions of a country'
    );
  }
};
