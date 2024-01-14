const ErrorService = require('../../../services/ErrorService');
const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toListFromController } = require('../../../services/mapping/utils');
const {
  toSimpleDocumentDuplicate,
} = require('../../../services/mapping/converters');

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
  const skip = Math.max(req.param('skip', 0), 0);
  const limit = Math.max(Math.min(req.param('limit', 50), 100), 1);
  try {
    const totalNb = await TDocumentDuplicate.count();
    const duplicates = await TDocumentDuplicate.find()
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate('author');

    return ControllerService.treatAndConvert(
      req,
      null,
      duplicates,
      {
        controllerMethod: 'DocumentDuplicateController.findAll',
        limit,
        searchedItem: 'Document duplicates',
        skip,
        total: totalNb,
        url: req.originalUrl,
      },
      res,
      (data) =>
        toListFromController('duplicates', data, toSimpleDocumentDuplicate)
    );
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
