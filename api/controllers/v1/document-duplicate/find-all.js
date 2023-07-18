const ErrorService = require('../../../services/ErrorService');
const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toDocumentDuplicate } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to find all document duplicates.'
    );
  }

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
      (data) => toListFromController('duplicates', data, toDocumentDuplicate)
    );
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
