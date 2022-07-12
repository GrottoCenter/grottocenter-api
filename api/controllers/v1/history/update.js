const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.HISTORY,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any history.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any history.');
  }

  // Check if history exists
  const historyId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: historyId,
      sailsModel: THistory,
    }))
  ) {
    return res.notFound({
      message: `History of id ${historyId} not found.`,
    });
  }

  const newBody = req.param('body');
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newBody && { body: newBody }),
    ...(newLanguage && { language: newLanguage }),
  };

  try {
    await THistory.updateOne({
      id: historyId,
    }).set(cleanedData);
    const populatedHistory = await THistory.findOne(historyId)
      .populate('author')
      .populate('entrance')
      .populate('language')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'HistoryController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedHistory,
      params,
      res,
      MappingService.convertToHistoryModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
