const ControllerService = require('../../../services/ControllerService');
const { toListCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

module.exports = async (req, res) => {
  const adminGroup = await TGroup.findOne({
    name: 'Administrator',
  }).populate('cavers');

  if (!adminGroup) return res.notFound({ message: 'No administrators found.' });

  return ControllerService.treatAndConvert(
    req,
    null,
    adminGroup.cavers,
    { controllerMethod: 'CaverController.getAdmins' },
    res,
    (data) => toListFromController('cavers', data, toListCaver)
  );
};
