const ErrorService = require('../../../services/ErrorService');
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
  const idArray = req.param('id');
  if (!idArray) {
    return res.badRequest('You must provide the id of the duplicates.');
  }

  try {
    await TEntranceDuplicate.destroy({
      id: idArray,
    });
    return res.ok();
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
