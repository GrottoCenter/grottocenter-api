/**
 * AccountController
 *
 * @description :: Server-side logic for managing user accounts
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const jwt = require('jsonwebtoken');

const AuthService = require('../services/AuthService');
const RightService = require('../services/RightService');
const TokenService = require('../services/TokenService');

const { createHashedPassword, tokenSalt } = AuthService;

const PASSWORD_MIN_LENGTH = 8;
const RESET_PASSWORD_LINK = `${sails.config.custom.baseUrl}/ui/changePassword?token=`;

const getResetPasswordTokenSalt = (user) => {
  const { dateInscription, id, password } = user;
  return password + id + dateInscription + tokenSalt;
};

module.exports = {
  changeAlertForNews: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to change your account information.',
      ));
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to change your account information.',
      );
    }

    // Check params
    const newAlertForNewsValue = req.param('alertForNews');
    if (newAlertForNewsValue !== 'true' && newAlertForNewsValue !== 'false') {
      return res.badRequest(
        'You must provide an alertForNews value (\'true\' or \'false\').',
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
        return res.status.send({
          message: `Caver with id ${req.token.id} not found.`,
        });
      }
    } catch (error) {
      sails.log.error(error);
    }

    return res.sendStatus(204);
  },
  changeEmail: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.CAVER,
        rightAction: RightService.RightActions.EDIT_OWN,
      })
      .intercept('rightNotFound', () => res.serverError(
        'A server error occured when checking your right to change your account information.',
      ));
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to change your account information.',
      );
    }

    // Check params
    const emailProvided = req.param('email');
    if (!emailProvided) {
      return res.badRequest('You must provide an email.');
    }

    // Perform update
    await TCaver.updateOne({
      id: req.token.id,
    })
      .set({
        mail: req.param('email'),
      })
      .intercept({ name: 'UsageError' }, () => res.badRequest(
        'The email you are trying to set for your account is not a valid email.',
      ));

    return res.sendStatus(204);
  },

  forgotPassword: async (req, res) => {
    const emailProvided = req.param('email');
    if (!emailProvided) {
      return res.badRequest('You must provide an email.');
    }

    // Get info about the user
    const userFound = await TCaver.findOne({ mail: emailProvided }).populate(
      'language',
    );
    if (!userFound) {
      return res.status(404).send({
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
      getResetPasswordTokenSalt(userFound), // custom salt used for more security
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
      .intercept('sendSESEmailError', () => res.serverError(
        'The email service has encountered an error. Please try again later or contact Wikicaves for more information.',
      ));
    return res.sendStatus(204);
  },

  // eslint-disable-next-line consistent-return
  changePassword: async (req, res) => {
    // Check params
    const password = req.param('password');
    const token = req.param('token');
    if (!password) {
      return res.badRequest('You must provide a password.');
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.badRequest(
        `Your password must be at least ${
          PASSWORD_MIN_LENGTH
        } characters long.`,
      );
    }
    if (!token) {
      return res.badRequest('You must provide a reset password token.');
    }

    // Get user
    const decodedToken = jwt.decode(token);
    if (!decodedToken || decodedToken.userId === undefined) {
      return res.badRequest("Invalid token, can't decode it.");
    }

    const userFound = await TCaver.findOne(decodedToken.userId);
    if (!userFound) {
      return res.status(404).send({
        message: `User with id ${decodedToken.userId} not found.`,
      });
    }

    // Check token
    const resetPasswordSalt = getResetPasswordTokenSalt(userFound);
    const verifyTokenCallback = async (err) => {
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
