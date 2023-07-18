const esClient = require('../../../../config/elasticsearch').elasticsearchCli;
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to set caver groups.');
  }

  // Check params
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('caverId'),
      sailsModel: TCaver,
    }))
  ) {
    return res.badRequest(
      `Could not find caver with id ${req.param('caverId')}.`
    );
  }

  const newGroups = req.param('groups');
  const notFoundGroup = newGroups.find(
    async (g) =>
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: g.id,
        sailsModel: TGroup,
      }))
  );
  if (notFoundGroup.length > 0) {
    return res.badRequest(
      `Could not find group with id ${notFoundGroup[0].id}.`
    );
  }

  // Update caver
  try {
    await TCaver.replaceCollection(
      req.param('caverId'),
      'groups',
      newGroups.map((g) => g.id)
    );
    esClient.update({
      index: 'cavers-index',
      id: req.param('caverId'),
      body: {
        doc: {
          groups: newGroups.map((g) => g.id).join(','),
        },
      },
    });

    const params = {};
    params.controllerMethod = 'CaverController.setGroups';
    return ControllerService.treat(req, null, {}, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
