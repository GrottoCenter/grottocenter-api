const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  const countryId = req.param('id');
  if (!(await checkIfExists('id', countryId, TCountry))) {
    return res.notFound({
      message: `Country with id ${countryId} not found.`,
    });
  }

  try {
    const country = await TCountry.findOne(countryId);
    const params = {
      controllerMethod: 'Country.find',
      searchedItem: `Country of id ${countryId}`,
    };
    // TODO: if needed elsewhere, refactor this in the converters, using a toCountry function
    const formattedCountry = {
      ...country,
      latitude: parseFloat(country.latitude),
      longitude: parseFloat(country.longitude),
    };
    return ControllerService.treat(req, null, formattedCountry, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
