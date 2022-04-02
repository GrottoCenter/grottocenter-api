const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TType.findOne(req.params.id).exec((err, found) => {
    const params = {};
    params.controllerMethod = 'DocumentTypeController.find';
    params.searchedItem = `Document type of id ${req.params.id}`;
    return ControllerService.treat(req, err, found, params, res);
  });
};
