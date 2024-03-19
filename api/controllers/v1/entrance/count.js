const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TEntrance.count({ isDeleted: false });
  const params = {
    controllerMethod: 'EntranceController.count',
    notFoundMessage: 'Problem while getting number of entrances.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
