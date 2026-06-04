const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');
const { toList } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const countryId = req.param('id');
  const country = await TCountry.findOne(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
  }

  const guidelines = await GuidelineService.getGuidelinesForEntity(
    'country',
    countryId
  );

  // TODO: if needed elsewhere, refactor this in the converters, using a toCountry function
  const formattedCountry = {
    ...country,
    latitude: parseFloat(country.latitude),
    longitude: parseFloat(country.longitude),
    guidelines: toList('guidelines', { guidelines }, toSimpleGuideline),
  };
  return ControllerService.treat(
    req,
    null,
    formattedCountry,
    {
      controllerMethod: 'Country.find',
      searchedItem: `Country of id ${countryId}`,
    },
    res
  );
};
