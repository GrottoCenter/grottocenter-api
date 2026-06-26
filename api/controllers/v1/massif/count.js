const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TMassif.count({ isDeleted: false });
  const params = {
    controllerMethod: 'MassifController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
