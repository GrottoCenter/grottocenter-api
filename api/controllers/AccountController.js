/**
 * AccountController
 *
 * @description :: Server-side logic for managing user accounts
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const jwt = require('jsonwebtoken');
const { createHashedPassword, tokenSalt } = AuthService;

const PASSWORD_MIN_LENGTH = 8;
const RESET_PASSWORD_LINK =
  'https://beta.grottocenter.org/ui/changePassword?token=';

const getResetPasswordTokenSalt = (user) => {
  return user.password + user.id + user.dateInscription + tokenSalt;
};

module.exports = {
  forgotPassword: async (req, res) => {
    const emailProvided = req.param('email');
    if (!emailProvided) {
      return res.badRequest(`You must provide an email.`);
    }

    // Get info about the user
    const userFound = await TCaver.findOne({ mail: emailProvided }).populate(
      'language',
    );
    if (!userFound) {
      return res.status(404).send({
        message: 'Caver with email ' + emailProvided + ' not found.',
      });
    }

    // Generate reset password token
    const token = TokenService.issue(
      {
        userId: userFound.id,
      },
      getResetPasswordTokenSalt(userFound), // custom salt used for more security
      24, // Expires after 1 day (24h)
      'Reset password',
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
        },
      })
      .intercept('sendSESEmailError', () => {
        return res.serverError(
          'The email service has encountered an error. Please try again later or contact Wikicaves for more information.',
        );
      });
    return res.sendStatus(204);
  },

  changePassword: async (req, res) => {
    // Check params
    const password = req.param('password');
    const token = req.param('token');
    if (!password) {
      return res.badRequest(`You must provide a password.`);
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.badRequest(
        'Your password must be at least ' +
          PASSWORD_MIN_LENGTH +
          ' characters long.',
      );
    }
    if (!token) {
      return res.badRequest(`You must provide a reset password token.`);
    }

    // Get user
    const decodedToken = jwt.decode(token);
    const userFound = await TCaver.findOne(decodedToken.userId);
    if (!userFound) {
      return res.status(404).send({
        message: 'User with id ' + decodedToken.userId + ' not found.',
      });
    }

    // Check token
    const resetPasswordSalt = getResetPasswordTokenSalt(userFound);
    const verifyTokenCallback = async (err, decodedToken) => {
      if (err) {
        switch (err.name) {
          case 'TokenExpiredError':
            return res.forbidden('The password reset token has expired.');
          case 'JsonWebTokenError':
            return res.forbidden(
              'The password reset token signature is invalid.',
            );
          default:
            return res.serverError(
              'An unexpected error occured when verifying the password reset token.',
            );
        }
      }
      // Update password request
      await TCaver.updateOne({
        id: decodedToken.userId,
      }).set({
        password: createHashedPassword(password),
      });

      return res.sendStatus(204);
    };
    TokenService.verify(token, verifyTokenCallback, resetPasswordSalt);
  },
};
