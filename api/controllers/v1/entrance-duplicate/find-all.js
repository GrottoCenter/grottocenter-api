const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const { toEntranceDuplicate } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'ASC'
  )}`;
  const limit = req.param('limit', 50);
  const skip = req.param('skip', 0);
  try {
    const duplicates = await TEntranceDuplicate.find()
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate('author');
    const totalNb = await TEntranceDuplicate.count();

    const params = {
      controllerMethod: 'EntranceDuplicateController.findAll',
      limit,
      searchedItem: 'Entrance duplicates',
      skip,
      total: totalNb,
      url: req.originalUrl,
    };

    return ControllerService.treatAndConvert(
      req,
      null,
      duplicates,
      params,
      res,
      (data, meta) =>
        toListFromController('duplicates', data, toEntranceDuplicate, { meta })
    );
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
