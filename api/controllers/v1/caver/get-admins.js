const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const {
  convertToCaverModel,
} = require('../../../services/mapping/MappingService');
const {
  convertToListFromController,
} = require('../../../services/mapping/utils');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.VIEW_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to view admins.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to view admins.');
  }

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
    (data) => convertToListFromController('cavers', data, convertToCaverModel)
  );
};
