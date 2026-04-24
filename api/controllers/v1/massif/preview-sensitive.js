const RightService = require('../../../services/RightService');
const MassifService = require('../../../services/MassifService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!isAdmin) {
    return res.forbidden('Only administrators can perform this action.');
  }

  const massifId = req.param('id');
  if (!massifId) {
    return res.badRequest('massifId is required.');
  }

  const massifExists = await TMassif.count({ id: massifId, isDeleted: false });
  if (!massifExists) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const count = await MassifService.countUnsensitiveEntrances(massifId);

  return ControllerService.treat(
    req,
    null,
    { count },
    { controllerMethod: 'MassifController.preview-sensitive' },
    res
  );
};
