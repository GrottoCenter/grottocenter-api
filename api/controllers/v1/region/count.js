const ControllerService = require('../../../services/ControllerService');
const RegionService = require('../../../services/RegionService');

module.exports = async (req, res) => {
  const { countryId } = req.params;

  // Check if country exists
  const country = await TCountry.findOne(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
  }

  const nbRegions = await RegionService.getNbRegionsByCountry(countryId);
  const nbRegionsAsNumber =
    nbRegions && nbRegions.count ? Number.parseInt(nbRegions.count, 10) : null;

  return ControllerService.treat(
    req,
    null,
    { count: nbRegionsAsNumber },
    { controllerMethod: 'RegionController.count' },
    res
  );
};
