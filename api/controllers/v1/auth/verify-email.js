const AccountNotificationService = require('../../../services/AccountNotificationService');

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

  if (caver.pendingMail) {
    const alreadyInUse = await TCaver.findOne({
      id: { '!=': caver.id },
      or: [{ mail: caver.pendingMail }, { pendingMail: caver.pendingMail }],
    });

    if (alreadyInUse) {
      await TCaver.updateOne({ id: caver.id }).set({
        pendingMail: null,
        activationCode: null,
      });
      return res.conflict(
        'The new email is already in use by another account.'
      );
    }

    updates.mail = caver.pendingMail;
    updates.pendingMail = null;
  }

  if (!caver.activated) {
    updates.activated = true;
  }

  try {
    await TCaver.updateOne({ id: caver.id }).set(updates);
  } catch (err) {
    if (err.code === 'E_UNIQUE') {
      await TCaver.updateOne({ id: caver.id }).set({
        pendingMail: null,
        activationCode: null,
      });
      return res.conflict(
        'The new email is already in use by another account.'
      );
    }
    sails.log.error(`Failed to verify email for user ${caver.id}:`, err);
    return res.serverError('An error occurred during email verification.');
  }

  if (caver.pendingMail) {
    AccountNotificationService.notifyEmailChanged({
      oldEmail: caver.mail,
      nickname: caver.nickname,
      languageId: caver.language,
    }).catch((err) => {
      sails.log.error('Failed to send email change notification:', err);
    });
    return res.ok({ message: 'Email successfully changed.' });
  }

  if (caver.activated) {
    return res.ok({ message: 'Account was already verified.' });
  }

  return res.ok({ message: 'Account successfully verified.' });
};
