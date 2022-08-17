const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.RIGGING,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any rigging.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any rigging.');
  }

  // Check if rigging exists
  const riggingId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: riggingId,
      sailsModel: TRigging,
    }))
  )
    return res.notFound({
      message: `Rigging of id ${riggingId} not found.`,
    });

  const newTitle = req.param('title');
  const newObstacles = req.param('obstacles');
  const newRopes = req.param('ropes');
  const newAnchors = req.param('anchors');
  const newObservations = req.param('observations');
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newTitle && { title: newTitle }),
    ...(newObstacles && { obstacles: newObstacles }),
    ...(newRopes && { ropes: newRopes }),
    ...(newAnchors && { anchors: newAnchors }),
    ...(newObservations && { observations: newObservations }),
    ...(newLanguage && { language: newLanguage }),
  };

  try {
    await TRigging.updateOne({
      id: riggingId,
    }).set(cleanedData);
    const populatedRigging = await TRigging.findOne(riggingId)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'RiggingController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedRigging,
      params,
      res,
      MappingService.convertToRiggingModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
