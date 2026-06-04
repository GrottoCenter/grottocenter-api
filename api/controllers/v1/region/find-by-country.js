const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');
const { toList } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const { countryId } = req.params;
  const { regionId } = req.params;

  // Find ISO 3166-2 region by ID (format: countryId-regionId, e.g., US-CA)
  const isoCode = `${countryId}-${regionId}`;

  try {
    const region = await TISO31662.findOne({ id: isoCode });
    if (!region) {
      return res.notFound({ message: `Region with id ${isoCode} not found.` });
    }

    const guidelines = await GuidelineService.getGuidelinesForEntity(
      'region',
      isoCode
    );
    const formattedRegion = {
      ...region,
      guidelines: toList('guidelines', { guidelines }, toSimpleGuideline),
    };

    return ControllerService.treat(
      req,
      null,
      formattedRegion,
      {
        controllerMethod: 'TISO31662Controller.findByCountry',
        searchedItem: `Region ${isoCode}`,
      },
      res
    );
  } catch (err) {
    return ControllerService.treat(
      req,
      err,
      null,
      {
        controllerMethod: 'TISO31662Controller.findByCountry',
        searchedItem: `Region ${isoCode}`,
      },
      res
    );
  }
};
