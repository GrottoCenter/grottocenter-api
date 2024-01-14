const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TDocument.count();
  const params = {
    controllerMethod: 'DocumentController.count',
    notFoundMessage: 'Problem while getting number of documents.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
