const ControllerService = require('../../../services/ControllerService');
const CountryService = require('../../../services/CountryService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const params = {
      controllerMethod: 'CountryController.count',
    };

    const nbCountries = await CountryService.getNbCountries();
    const nbCountriesAsNumber =
      nbCountries && nbCountries.count
        ? Number.parseInt(nbCountries.count, 10)
        : null;

    return ControllerService.treat(
      req,
      null,
      { count: nbCountriesAsNumber },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
