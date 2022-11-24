const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/mapping/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a caver.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a caver.');
  }

  // Check params
  if (!req.param('name')) {
    return res.badRequest('You must provide a name to create a new caver.');
  }
  if (!req.param('surname')) {
    return res.badRequest('You must provide a surname to create a new caver.');
  }

  const paramsCaver = {
    name: req.param('name'),
    surname: req.param('surname'),
  };

  try {
    const newCaver = await CaverService.createNonUserCaver(paramsCaver);
    const params = {};
    params.controllerMethod = 'CaverController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newCaver,
      params,
      res,
      MappingService.convertToCaverModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
