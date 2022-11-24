const ErrorService = require('../../../services/ErrorService');
const ControllerService = require('../../../services/ControllerService');
const {
  convertToListFromController,
} = require('../../../services/mapping/utils');
const {
  convertToDocumentDuplicateModel,
} = require('../../../services/mapping/MappingService');

module.exports = async (req, res) => {
  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'ASC'
  )}`;
  const limit = req.param('limit', 50);
  const skip = req.param('skip', 0);
  try {
    const duplicates = await TDocumentDuplicate.find()
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate('author');
    const totalNb = await TDocumentDuplicate.count();

    const params = {
      controllerMethod: 'DocumentDuplicateController.findAll',
      limit,
      searchedItem: 'Document duplicates',
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
      (data) =>
        convertToListFromController(
          'duplicates',
          data,
          convertToDocumentDuplicateModel
        )
    );
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
