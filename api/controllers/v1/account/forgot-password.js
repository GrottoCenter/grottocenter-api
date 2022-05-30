const AccountService = require('../../../services/AccountService');
const TokenService = require('../../../services/TokenService');

const RESET_PASSWORD_LINK = `${sails.config.custom.baseUrl}/ui/changePassword?token=`;

module.exports = async (req, res) => {
  const emailProvided = req.param('email');
  if (!emailProvided) {
    return res.badRequest('You must provide an email.');
  }

  // Get info about the user
  const userFound = await TCaver.findOne({ mail: emailProvided }).populate(
    'language'
  );
  if (!userFound) {
    return res.notFound({
      message: `Caver with email ${emailProvided} not found.`,
    });
  }

  // Generate reset password token
  const token = TokenService.issue(
    {
      userId: userFound.id,
    },
    sails.config.custom.passwordResetTokenTTL,
    'Reset password',
    AccountService.getResetPasswordTokenSalt(userFound) // custom salt used for more security
  );

  // Change locale to the user's one to translate the mail
  req.setLocale(userFound.language.part1);

  await sails.helpers.sendEmail
    .with({
      allowResponse: false,
      emailSubject: 'Password Reset',
      i18n: req.i18n,
      recipientEmail: emailProvided,
      viewName: 'forgotPassword',
      viewValues: {
        recipientName: userFound.nickname,
        resetLink: RESET_PASSWORD_LINK + token,
        token,
      },
    })
    .intercept('sendSESEmailError', () =>
      res.serverError(
        'The email service has encountered an error. Please try again later or contact Wikicaves for more information.'
      )
    );
  return res.ok();
};
