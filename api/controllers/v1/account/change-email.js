const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
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
      mail: req.param('email').toLowerCase(),
    });

    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
