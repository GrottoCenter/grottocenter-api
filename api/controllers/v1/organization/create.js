const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingV1Service = require('../../../services/MappingV1Service');
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
    language: ramda.propOr(undefined, 'language', req.param('name')),
    text: req.param('name').text,
  };

  try {
    const newOrganizationPopulated = await GrottoService.createGrotto(
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
      MappingV1Service.convertToOrganizationModel
    );
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
