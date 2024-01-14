const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toSimpleCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  // Get Admins
  const adminGroup = await TGroup.find({
    name: 'Administrator',
  }).populate('cavers');

  if (!adminGroup) return res.notFound({ message: 'No administrators found.' });

  const admins = adminGroup[0].cavers;
  const adminsWithGroups = await Promise.all(
    admins.map(async (caver) => ({
      ...caver,
      groups: await CaverService.getGroups(caver.id),
    }))
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    adminsWithGroups,
    { controllerMethod: 'CaverController.getAdmins' },
    res,
    (data) => toListFromController('cavers', data, toSimpleCaver)
  );
};
