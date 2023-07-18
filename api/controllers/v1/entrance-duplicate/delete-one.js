const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to delete an entrance duplicate.'
    );
  }
  const id = req.param('id');
  if (!id) {
    return res.badRequest('You must provide the id of the duplicate.');
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

  await TEntranceDuplicate.destroyOne(id);
  return res.ok();
};
