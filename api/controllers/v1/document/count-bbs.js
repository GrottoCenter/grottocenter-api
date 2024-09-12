const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TDocument.count({
    nameDbImport: 'BBS',
    isDeleted: false,
  });
  const params = {
    controllerMethod: 'DocumentController.countBBS',
    notFoundMessage: 'Problem while getting number of BBS documents.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
