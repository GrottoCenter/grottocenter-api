const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const {
  toQualityDataEntrance,
} = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  try {
    const params = {
      controllerMethod: 'MassifController.get-entrances-data-quality',
    };

    // Chek if massif id is present in the params request
    if (!req.params.id) {
      return ControllerService.treat(
        req,
        'Missing massif id',
        null,
        params,
        res
      );
    }

    const massifId = req.params.id;

    // Get entrances and the informations associated at each entrance
    const entrancesInformationToCompute =
      await DataQualityComputeService.getEntrancesWithQualityByMassif(massifId);

    // Chek if entrancesInformationToCompute is empty
    if (
      !entrancesInformationToCompute ||
      entrancesInformationToCompute.length <= 0
    ) {
      return ControllerService.treat(
        req,
        "Massif doesn't exist or hasn't entrances",
        null,
        params,
        res
      );
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      entrancesInformationToCompute,
      params,
      res,
      (data) => toListFromController('quality', data, toQualityDataEntrance)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
