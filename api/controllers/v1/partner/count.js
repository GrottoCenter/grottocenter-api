const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TGrotto.count({
    isOfficialPartner: true,
    isDeleted: false,
  });
  const params = {
    controllerMethod: 'PartnerController.count',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
