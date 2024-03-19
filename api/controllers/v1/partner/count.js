const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TGrotto.count({
    isOfficialPartner: true,
    isDeleted: false,
  });
  const params = {
    controllerMethod: 'PartnerController.count',
    notFoundMessage: 'Problem while getting number of official partners.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
