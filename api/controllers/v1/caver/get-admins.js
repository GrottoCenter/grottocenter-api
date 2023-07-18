const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  // Get Admins
  const adminGroup = await TGroup.find({
    name: 'Administrator',
  }).populate('cavers');
  if (!adminGroup) {
    return res.notFound({ message: 'No administrators found.' });
  }
  const params = {};
  const admins = adminGroup[0].cavers;
  const adminsWithGroups = await Promise.all(
    admins.map(async (caver) => ({
      ...caver,
      groups: await CaverService.getGroups(caver.id),
    }))
  );
  params.controllerMethod = 'CaverController.getAdmins';
  return ControllerService.treatAndConvert(
    req,
    null,
    adminsWithGroups,
    params,
    res,
    (data) => toListFromController('cavers', data, toCaver)
  );
};
