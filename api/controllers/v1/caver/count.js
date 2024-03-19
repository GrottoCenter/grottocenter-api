const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TCaver.count({ isDeleted: false });
  const params = {
    controllerMethod: 'CaverController.count',
    notFoundMessage: 'Problem while getting number of cavers.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
