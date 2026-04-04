const ControllerService = require('../../../services/ControllerService');
const { toListCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const moderatorGroup = await TGroup.findOne({
    name: 'Moderator',
  }).populate('cavers');

  if (!moderatorGroup) return res.notFound({ message: 'No moderators found.' });

  return ControllerService.treatAndConvert(
    req,
    null,
    moderatorGroup.cavers,
    { controllerMethod: 'CaverController.getModerators' },
    res,
    (data) => toListFromController('cavers', data, toListCaver)
  );
};
