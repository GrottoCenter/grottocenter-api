const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingService = require('../../../services/mapping/MappingService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ORGANIZATION,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create an organization.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create an organization.');
  }

  // Check params
  if (!req.param('name')) {
    return res.badRequest(
      'You must provide a name to create a new organization.'
    );
  }

  const cleanedData = {
    ...GrottoService.getConvertedDataFromClientRequest(req),
    author: req.token.id,
    dateInscription: new Date(),
  };

  const nameData = {
    author: req.token.id,
    language: req.param('name').language,
    text: req.param('name').text,
  };

  try {
    const newOrganizationPopulated = await GrottoService.createGrotto(
      req,
      cleanedData,
      nameData
    );
    const params = {};
    params.controllerMethod = 'GrottoController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newOrganizationPopulated,
      params,
      res,
      MappingService.convertToOrganizationModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
