const ControllerService = require('../../../services/ControllerService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const {
  toQualityDataEntrance,
} = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
const {
  SORTABLE_COLUMNS_COUNTRY,
  VALIDATION_ERROR,
  validateSortParams,
} = require('../../../utils/validateSortParams');

module.exports = async (req, res) => {
  // Get entrances and the informations associated at each entrance
  const countryId = req.params.id;
  const limit = Math.min(parseInt(req.param('limit', 50), 10), 1000);
  const offset = Math.max(parseInt(req.param('offset', 0), 10), 0);

  const sortResult = validateSortParams(req, res, SORTABLE_COLUMNS_COUNTRY);
  if (sortResult === VALIDATION_ERROR) return null;
  const sort = sortResult ? sortResult.sort : null;
  const order = sortResult ? sortResult.order : null;

  const [entrancesInformationToCompute, totalCount] = await Promise.all([
    DataQualityComputeService.getEntrancesWithQualityByCountry(
      countryId,
      limit,
      offset,
      sort,
      order
    ),
    DataQualityComputeService.getEntrancesWithQualityByCountryCount(countryId),
  ]);

  if (
    !entrancesInformationToCompute ||
    entrancesInformationToCompute.length <= 0
  ) {
    return res.notFound({
      message: `Country does not exist or has no entrances`,
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
    { controllerMethod: 'CountryController.get-entrances-data-quality' },
    res
  );
};
