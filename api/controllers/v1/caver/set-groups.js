const esClient = require('../../../../config/elasticsearch').elasticsearchCli;
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to set caver groups.'
      )
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
