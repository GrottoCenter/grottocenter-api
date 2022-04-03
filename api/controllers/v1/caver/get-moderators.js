const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const MappingV1Service = require('../../../services/MappingV1Service');
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
    return res.status(404).send({ message: 'No moderators found.' });
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
    MappingV1Service.convertToCaverList
  );
};