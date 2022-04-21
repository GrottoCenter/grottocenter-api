const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const countResult = await TGrotto.count();
    const params = {};
    params.controllerMethod = 'GrottoController.count';
    params.notFoundMessage = 'Problem while getting number of organizations.';

    const count = { count: countResult };
    return ControllerService.treat(req, null, count, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
