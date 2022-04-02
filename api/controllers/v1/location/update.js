const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingV1Service');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.LOCATION,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any location.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any location.');
  }

  // Check if location exists
  const locationId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: locationId,
      sailsModel: TLocation,
    }))
  ) {
    return res.status(404).send({
      message: `Location of id ${locationId} not found.`,
    });
  }

  const newBody = req.param('body');
  const newTitle = req.param('title');
  const cleanedData = {
    ...(newBody && { body: newBody }),
    ...(newTitle && { title: newTitle }),
  };

  try {
    await TLocation.updateOne({
      id: locationId,
    }).set(cleanedData);
    const populatedLocation = await TLocation.findOne(locationId)
      .populate('author')
      .populate('entrance')
      .populate('language')
      .populate('reviewer');

    const params = {};
    params.controllerMethod = 'LocationController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedLocation,
      params,
      res,
      MappingV1Service.convertToLocationModel
    );
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
