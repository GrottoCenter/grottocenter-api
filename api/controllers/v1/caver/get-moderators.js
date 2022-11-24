const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toCaver } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
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
        'A server error occured when checking your right to view moderators.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to view moderators.');
  }

  // Get Moderators
  const moderatorGroup = await TGroup.find({
    name: 'Moderator',
  }).populate('cavers');
  if (!moderatorGroup) {
    return res.notFound({ message: 'No moderators found.' });
  }
  const params = {};
  const moderators = moderatorGroup[0].cavers;
  const moderatorsWithGroups = await Promise.all(
    moderators.map(async (caver) => ({
      ...caver,
      groups: await CaverService.getGroups(caver.id),
    }))
  );
  params.controllerMethod = 'CaverController.getModerators';
  return ControllerService.treatAndConvert(
    req,
    null,
    moderatorsWithGroups,
    params,
    res,
    (data) => toListFromController('cavers', data, toCaver)
  );
};
