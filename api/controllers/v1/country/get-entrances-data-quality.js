const ControllerService = require('../../../services/ControllerService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const {
  toQualityDataEntrance,
} = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  // Get entrances and the informations associated at each entrance
  const countryId = req.params.id;
  const entrancesInformationToCompute =
    await DataQualityComputeService.getEntrancesWithQualityByCountry(countryId);

  if (
    !entrancesInformationToCompute ||
    entrancesInformationToCompute.length <= 0
  ) {
    return res.notFound({
      message: `Massif does not exist or has no entrances`,
    });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    entrancesInformationToCompute,
    { controllerMethod: 'CountryController.get-entrances-data-quality' },
    res,
    (data) => toListFromController('quality', data, toQualityDataEntrance)
  );
};
