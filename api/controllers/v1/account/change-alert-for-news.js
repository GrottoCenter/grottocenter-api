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
  const newAlertForNewsValue = req.param('alertForNews');
  if (newAlertForNewsValue !== 'true' && newAlertForNewsValue !== 'false') {
    return res.badRequest(
      "You must provide an alertForNews value ('true' or 'false')."
    );
  }

  // Update alertForNews request
  try {
    const updatedCaver = await TCaver.updateOne({
      id: req.token.id,
    }).set({
      alertForNews: newAlertForNewsValue === 'true',
    });
    if (!updatedCaver) {
      return res.notFound({
        message: `Caver with id ${req.token.id} not found.`,
      });
    }
  } catch (error) {
    sails.log.error(error);
  }

  return res.ok();
};
