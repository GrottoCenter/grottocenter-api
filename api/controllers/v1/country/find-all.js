const ControllerService = require('../../../services/ControllerService');
const CountryService = require('../../../services/CountryService');

module.exports = async (req, res) => {
  try {
    const countries = await CountryService.getEntranceCountsByCountry();
    return ControllerService.treat(
      req,
      null,
      { countries },
      { controllerMethod: 'CountryController.find-all' },
      res
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An internal error occurred when getting the countries'
    );
  }
};
