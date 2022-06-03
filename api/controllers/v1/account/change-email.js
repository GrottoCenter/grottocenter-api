const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.EDIT_OWN,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to change your account information.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to change your account information.'
    );
  }

  // Check params
  const emailProvided = req.param('email');
  if (!emailProvided) {
    return res.badRequest('You must provide an email.');
  }

  // Perform update
  try {
    await TCaver.updateOne({
      id: req.token.id,
    }).set({
      mail: req.param('email'),
    });

    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
