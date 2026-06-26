const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TGrotto.count({ isDeleted: false });
  const params = {
    controllerMethod: 'GrottoController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
