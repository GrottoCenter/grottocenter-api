const TokenService = require('../../../services/TokenService');
const CaverService = require('../../../services/CaverService');

const RESET_PASSWORD_LINK = `${sails.config.custom.baseUrl}/ui/changePassword?token=`;

module.exports = async (req, res) => {
  const emailProvided = req.param('email');
  if (!emailProvided || !CaverService.isARealCaver(emailProvided)) {
    return res.badRequest('You must provide a valid email.');
  }

  // Get info about the user
  const userFound = await TCaver.findOne({
    mail: emailProvided.toLowerCase(),
  }).populate('language');
  if (!userFound) {
    return res.notFound({
      message: `Caver with email ${emailProvided} not found.`,
    });
  }

  // If the caver is banned, return 200 OK without generating a token or sending an email
  // to prevent information leakage about ban status
  if (userFound.banned === true) {
    sails.log.warn(`Banned caver ${userFound.id} attempted password reset`);
    return res.ok();
  }

  // instructs the user to verify their email before asking for a password reset
  if (!userFound.activated) {
    return res.unauthorized({
      status: 'NotVerified',
      message:
        'Your account is not verified yet. Please check your email for the verification link.',
    });
  }

  // Generate reset password token
  const token = TokenService.issue(
    {
      userId: userFound.id,
    },
    sails.config.custom.passwordResetTokenTTL,
    'Reset password',
    TokenService.getResetPasswordTokenSalt(userFound) // custom salt used for more security
  );

  // Change locale to the user's one to translate the mail
  await sails.helpers.sendEmail
    .with({
      allowResponse: false,
      emailSubject: 'Password Reset',
      locale: userFound.language ? userFound.language.part1 : undefined,
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
