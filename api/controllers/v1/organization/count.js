const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TGrotto.count({ isDeleted: false });
  const params = {
    controllerMethod: 'GrottoController.count',
    notFoundMessage: 'Problem while getting number of organizations.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
