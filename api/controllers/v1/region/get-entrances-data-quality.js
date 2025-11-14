const ControllerService = require('../../../services/ControllerService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const {
  toQualityDataEntrance,
} = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const { countryId } = req.params;
  const { regionId } = req.params;
  const isoCode = `${countryId}-${regionId}`;
  const limit = Math.min(parseInt(req.param('limit', 50), 10), 1000);
  const offset = Math.max(parseInt(req.param('offset', 0), 10), 0);

  // Check if ISO 3166-2 region exists
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({
      message: `Region ${isoCode} not found.`,
    });
  }

  // Get entrances with quality data for the specific region
  const [entrancesInformationToCompute, totalCount] = await Promise.all([
    DataQualityComputeService.getEntrancesWithQualityByRegion(
      isoCode,
      limit,
      offset
    ),
    DataQualityComputeService.getEntrancesWithQualityByRegionCount(isoCode),
  ]);

  if (
    !entrancesInformationToCompute ||
    entrancesInformationToCompute.length <= 0
  ) {
    return res.notFound({
      message: `Region ${isoCode} does not exist or has no entrances`,
    });
  }

  const totalPages = Math.ceil(totalCount / limit);
  const result = {
    quality: toListFromController(
      'quality',
      entrancesInformationToCompute,
      toQualityDataEntrance
    ).quality,
    totalCount,
    totalPages,
  };

  return ControllerService.treat(
    req,
    null,
    result,
    { controllerMethod: 'RegionController.get-entrances-data-quality' },
    res
  );
};
