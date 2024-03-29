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
    return res.forbidden(
      'You are not authorized to remove a caver from a group.'
    );
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
      `Could not found caver with id ${req.param('caverId')}.`
    );
  }
  const groupId = req.param('groupId');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: groupId,
      sailsModel: TGroup,
    }))
  ) {
    return res.badRequest(
      `Could not found group with id ${req.param('groupId')}.`
    );
  }

  // Update caver
  try {
    await TCaver.removeFromCollection(
      req.param('caverId'),
      'groups',
      req.param('groupId')
    );
    const params = {};
    params.controllerMethod = 'CaverController.removeFromGroup';
    return ControllerService.treat(req, null, {}, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
