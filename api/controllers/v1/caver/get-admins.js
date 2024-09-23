const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toSimpleCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const adminGroup = await TGroup.findOne({
    name: 'Administrator',
  }).populate('cavers');

  if (!adminGroup) return res.notFound({ message: 'No administrators found.' });

  const admins = await CaverService.getGroups(
    adminGroup.cavers.map((e) => e.id)
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    admins,
    { controllerMethod: 'CaverController.getAdmins' },
    res,
    (data) => toListFromController('cavers', data, toSimpleCaver)
  );
};
