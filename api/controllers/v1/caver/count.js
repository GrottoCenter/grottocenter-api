const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TCaver.count();
  const params = {
    controllerMethod: 'CaverController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
