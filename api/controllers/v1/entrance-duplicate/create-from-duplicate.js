const EntranceService = require('../../../services/EntranceService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create an entrance duplicate.'
    );
  }
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TEntranceDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }

  const id = req.param('id');

  const duplicate = await TEntranceDuplicate.findOne(id);

  const { entrance, nameDescLoc } = duplicate.content;
  try {
    await EntranceService.createEntrance(req, entrance, nameDescLoc);
    await TEntranceDuplicate.destroyOne(id);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
