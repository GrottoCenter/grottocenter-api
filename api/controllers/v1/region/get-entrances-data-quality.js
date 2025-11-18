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

  // Check if ISO 3166-2 region exists
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({
      message: `Region ${isoCode} not found.`,
    });
  }

  // Get entrances with quality data for the specific region
  const entrancesInformationToCompute =
    await DataQualityComputeService.getEntrancesWithQualityByRegion(isoCode);

  if (
    !entrancesInformationToCompute ||
    entrancesInformationToCompute.length <= 0
  ) {
    return res.notFound({
      message: `Region ${isoCode} does not exist or has no entrances`,
    });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    entrancesInformationToCompute,
    { controllerMethod: 'RegionController.get-entrances-data-quality' },
    res,
    (data) => toListFromController('quality', data, toQualityDataEntrance)
  );
};
