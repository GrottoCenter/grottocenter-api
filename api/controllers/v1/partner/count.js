const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TGrotto.count({ isOfficialPartner: true }).exec((err, found) => {
    const params = {
      controllerMethod: 'PartnerController.count',
      notFoundMessage: 'Problem while getting number of official partners.',
    };
    const count = {
      count: found,
    };
    return ControllerService.treat(req, err, count, params, res);
  });
};
