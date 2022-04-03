const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
      rightAction: RightService.RightActions.DELETE_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a document duplicate.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create a document duplicate.'
    );
  }

  const idArray = req.param('id');
  if (!idArray) {
    return res.badRequest('You must provide the id of the duplicates.');
  }

  try {
    await TDocumentDuplicate.destroy({
      id: idArray,
    });
    return res.ok();
  } catch (err) {
    ErrorService.getDefaultErrorHandler(res)(err);
    return false;
  }
};
