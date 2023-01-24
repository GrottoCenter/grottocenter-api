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
      controllerMethod: 'CountryController.get-entrances-data-quality',
    };

    // Chek if country id is present in the params request
    if (!req.params.id) {
      return ControllerService.treat(
        req,
        'Missing country id',
        null,
        params,
        res
      );
    }

    const countryId = req.params.id;

    // Get entrances and the informations associated at each entrance
    const entrancesInformationToCompute =
      await DataQualityComputeService.getEntrancesWithQualityByCountry(
        countryId
      );

    // Chek if entrancesInformationToCompute is empty
    if (entrancesInformationToCompute.length <= 0) {
      return ControllerService.treat(
        req,
        "Country doesn't exist or hasn't entrances",
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
