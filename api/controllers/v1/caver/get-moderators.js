const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toSimpleCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  // Get Moderators
  const moderatorGroup = await TGroup.find({
    name: 'Moderator',
  }).populate('cavers');

  if (!moderatorGroup) return res.notFound({ message: 'No moderators found.' });

  const moderators = moderatorGroup[0].cavers;
  const moderatorsWithGroups = await Promise.all(
    moderators.map(async (caver) => ({
      ...caver,
      groups: await CaverService.getGroups(caver.id),
    }))
  );
  return ControllerService.treatAndConvert(
    req,
    null,
    moderatorsWithGroups,
    { controllerMethod: 'CaverController.getModerators' },
    res,
    (data) => toListFromController('cavers', data, toSimpleCaver)
  );
};
