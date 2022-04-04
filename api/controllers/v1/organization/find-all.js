const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  const parameters = {};
  if (req.param('name')) {
    parameters.name = {
      like: `%${req.param('name')}%`,
    };
  }
  if (req.param('region')) {
    parameters.region = {
      like: `%${req.param('region')}%`,
    };
  }

  try {
    const organizations = await TGrotto.find(parameters)
      .populate('author')
      .sort('id ASC')
      .limit(10);
    const params = {};
    params.controllerMethod = 'GrottoController.findAll';
    params.notFoundMessage = 'No organizations found.';
    return ControllerService.treat(req, undefined, organizations, params, res);
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
