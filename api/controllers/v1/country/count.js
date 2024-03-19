const ControllerService = require('../../../services/ControllerService');
const CountryService = require('../../../services/CountryService');

module.exports = async (req, res) => {
  const nbCountries = await CountryService.getNbCountries();
  const nbCountriesAsNumber =
    nbCountries && nbCountries.count
      ? Number.parseInt(nbCountries.count, 10)
      : null;

  return ControllerService.treat(
    req,
    null,
    { count: nbCountriesAsNumber },
    { controllerMethod: 'CountryController.count' },
    res
  );
};
