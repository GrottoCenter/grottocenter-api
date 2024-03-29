const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  // Check params
  // name
  if (
    !ramda.propOr(null, 'text', req.param('name')) ||
    !ramda.propOr(null, 'language', req.param('name'))
  ) {
    return res.badRequest(
      'You must provide a name (with a language) for the new entrance'
    );
  }

  // cave
  if (!req.param('cave')) {
    return res.badRequest('You must provide a cave id for the new entrance');
  }
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('cave'),
      sailsModel: TCave,
    }))
  ) {
    return res.badRequest(
      `The cave with id ${req.param('cave')} does not exist.`
    );
  }

  // Get data & create entrance
  const cleanedData = {
    ...EntranceService.getConvertedDataFromClientRequest(req),
    author: req.token.id,
    dateInscription: new Date(),
    isOfInterest: false,
  };

  const nameDescLocData =
    EntranceService.getConvertedNameDescLocFromClientRequest(req);

  try {
    const newEntrancePopulated = await EntranceService.createEntrance(
      req,
      cleanedData,
      nameDescLocData
    );
    const params = {};
    params.controllerMethod = 'EntranceController.create';
    return ControllerService.treat(
      req,
      null,
      newEntrancePopulated,
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
