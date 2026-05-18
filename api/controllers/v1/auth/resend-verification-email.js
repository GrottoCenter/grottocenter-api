const util = require('util');
const AuthService = require('../../../services/AuthService');
const LanguageService = require('../../../services/LanguageService');

const setTimeoutP = util.promisify(setTimeout);

module.exports = async (req, res) => {
  await setTimeoutP(500); // Basic brute force prevention

  const email = req.param('email');

  if (!email) {
    return res.badRequest('You must provide an email address.');
  }

  const user = await TCaver.findOne({ mail: email.toLowerCase() });

  if (!user) {
    return res.ok();
  }

  // If the user is already activated, return success without sending an email
  if (user.activated) {
    return res.ok();
  }

  if (!user.mailIsValid) {
    return res.badRequest(
      'Your email address is marked as invalid. Please update your email address or contact us.'
    );
  }

  const activationCode = AuthService.generateActivationCode();

  try {
    await TCaver.updateOne({ id: user.id }).set({ activationCode });
  } catch (err) {
    sails.log.error(
      `Failed to update activation code for user ${user.id}:`,
      err
    );
    return res.serverError('An error occurred while updating your account.');
  }

  try {
    // Resolve the user's preferred locale for the email
    const locale = await LanguageService.getLocale(user.language);

    // Attempt to send the verification email
    await AuthService.sendVerificationEmail(user, activationCode, locale);
  } catch (err) {
    // Errors are already logged in AuthService.
  }

  return res.ok();
};
