const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.NAME,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any name.'
      )
    );

  if (!hasRight) {
    return res.forbidden('You are not authorized to update any name.');
  }

  // Check if name exists
  const nameId = req.param('id');
  const currentName = await TName.findOne(nameId);
  if (!currentName) {
    return res.status(404).send({
      message: `Name of id ${nameId} not found.`,
    });
  }

  const cleanedData = {
    name: req.param('name'),
  };

  try {
    await TName.updateOne({
      id: nameId,
    }).set(cleanedData);
    const newName = await TName.findOne(nameId)
      .populate('author')
      .populate('cave')
      .populate('entrance')
      .populate('grotto')
      .populate('language')
      .populate('massif')
      .populate('point')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'NameController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newName,
      params,
      res,
      MappingService.convertToNameModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
