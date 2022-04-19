const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DESCRIPTION,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any description.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any description.');
  }

  // Check if description exists
  const descriptionId = req.param('id');
  const currentDescription = await TDescription.findOne(descriptionId);
  if (!currentDescription) {
    return res.status(404).send({
      message: `Description of id ${descriptionId} not found.`,
    });
  }

  const cleanedData = {
    body: req.param('body') ? req.param('body') : currentDescription.body,
    title: req.param('title') ? req.param('title') : currentDescription.title,
  };

  // Launch update request
  try {
    await TDescription.updateOne({
      id: descriptionId,
    }).set(cleanedData);
    const newDescription = await TDescription.findOne(descriptionId)
      .populate('author')
      .populate('cave')
      .populate('document')
      .populate('entrance')
      .populate('exit')
      .populate('language')
      .populate('massif')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'DescriptionController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newDescription,
      params,
      res,
      MappingService.convertToDescriptionModel
    );
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
