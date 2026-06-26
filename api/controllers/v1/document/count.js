const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TDocument.count({ isDeleted: false });
  const params = {
    controllerMethod: 'DocumentController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
