const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TEntrance.count({ isDeleted: false });
  const params = {
    controllerMethod: 'EntranceController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
