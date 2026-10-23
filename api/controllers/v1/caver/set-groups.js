const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const isValidId = require('../../../utils/isValidId');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to set caver groups.');
  }

  const groupsParam = req.param('groups');
  if (
    !Array.isArray(groupsParam) ||
    !groupsParam.every((g) => isValidId(g?.id))
  ) {
    return res.badRequest(
      'groups must be an array of objects with an integer id.'
    );
  }

  const caverId = req.param('caverId');
  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }

  const newGroupIds = groupsParam.map((e) => e.id);
  const groups = await TGroup.find({ id: newGroupIds });
  if (newGroupIds.length !== groups.length) {
    return res.badRequest(`Could not find all given groups.`);
  }

  await TCaver.replaceCollection(caverId, 'groups', newGroupIds);
  await BlacklistService.revoke(parseInt(caverId, 10));

  const params = { controllerMethod: 'CaverController.setGroups' };
  return ControllerService.treat(req, null, {}, params, res);
};
