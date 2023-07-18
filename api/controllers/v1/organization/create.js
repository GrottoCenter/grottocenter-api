const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const { toOrganization } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
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
      toOrganization
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
