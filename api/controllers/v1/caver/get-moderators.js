const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toSimpleCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const moderatorGroup = await TGroup.findOne({
    name: 'Moderator',
  }).populate('cavers');

  if (!moderatorGroup) return res.notFound({ message: 'No moderators found.' });

  const moderators = await CaverService.getGroups(
    moderatorGroup.cavers.map((e) => e.id)
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    moderators,
    { controllerMethod: 'CaverController.getModerators' },
    res,
    (data) => toListFromController('cavers', data, toSimpleCaver)
  );
};
