const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to delete a document duplicate.'
    );
  }

  const id = req.param('id');
  if (!id) {
    return res.badRequest('You must provide the id of the duplicate.');
  }

  const documentDuplicate = await TDocumentDuplicate.findOne({ id });
  if (!documentDuplicate) {
    return res.badRequest(`Could not find duplicate with id ${id}.`);
  }

  await TDocumentDuplicate.destroyOne(id);
  return res.ok();
};
