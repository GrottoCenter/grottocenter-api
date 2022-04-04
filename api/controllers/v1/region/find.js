const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TRegion.findOne(req.params.id).exec((err, found) => {
    const params = {};
    params.controllerMethod = 'TRegionController.find';
    params.searchedItem = `Region of id ${req.params.id}`;
    return ControllerService.treat(req, err, found, params, res);
  });
};
