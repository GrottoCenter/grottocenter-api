const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to add a caver to a group.');
  }

  const caverId = req.param('caverId');
  const groupId = req.param('groupId');

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }

  const group = await TGroup.findOne({ id: groupId });
  if (!group) {
    return res.badRequest(`Could not find group with id ${groupId}.`);
  }

  await TCaver.addToCollection(caverId, 'groups', groupId);
  // TODO ES update ?

  const params = { controllerMethod: 'CaverController.putOnGroup' };
  return ControllerService.treat(req, null, {}, params, res);
};
