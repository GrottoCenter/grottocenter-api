module.exports = async (req, res) => {
  const token = req.param('token');

  if (!token) {
    return res.badRequest('You must provide an activation token.');
  }

  const caver = await TCaver.findOne({ activationCode: token });

  if (!caver) {
    return res.notFound(
      'Activation token is invalid or has already been used.'
    );
  }

  const updates = {
    activationCode: null,
    mailIsValid: true,
  };

  if (!caver.activated) {
    updates.activated = true;
  }

  try {
    await TCaver.updateOne({ id: caver.id }).set(updates);
  } catch (err) {
    sails.log.error(`Failed to activate user ${caver.id}:`, err);
    return res.serverError('An error occurred during account activation.');
  }

  if (caver.activated) {
    return res.ok({ message: 'Account was already verified.' });
  }

  return res.ok({ message: 'Account successfully verified.' });
};
