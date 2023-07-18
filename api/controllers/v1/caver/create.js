const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const { toCaver } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
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
      toCaver
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
