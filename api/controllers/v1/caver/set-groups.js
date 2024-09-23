const esClient = require('../../../../config/elasticsearch').elasticsearchCli;
const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to set caver groups.');
  }

  const caverId = req.param('caverId');
  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }

  const newGroupIds = req.param('groups').map((e) => e.id);
  const groups = await TGroup.find({ id: newGroupIds });
  if (newGroupIds.length !== groups.length) {
    return res.badRequest(`Could not find all given groups.`);
  }

  await TCaver.replaceCollection(caverId, 'groups', newGroupIds);

  esClient.update({
    index: 'cavers-index',
    id: req.param('caverId'),
    body: { doc: { groups: newGroupIds.join(',') } },
  });

  const params = { controllerMethod: 'CaverController.setGroups' };
  return ControllerService.treat(req, null, {}, params, res);
};
