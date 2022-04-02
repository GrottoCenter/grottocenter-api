const ControllerService = require('../../../services/ControllerService');

module.exports = (req) => {
  TGrotto.findOne(req.params.id).exec((err, found) => {
    const params = {};
    params.controllerMethod = 'PartnerController.find';
    params.notFoundMessage = `Partner of id ${req.params.id} not found.`;
    return ControllerService.treat(req, err, found, params);
  });
};
