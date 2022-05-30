const jwt = require('jsonwebtoken');

const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');

const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { createHashedPassword, tokenSalt } = AuthService;

const PASSWORD_MIN_LENGTH = 8;

const getResetPasswordTokenSalt = (user) => {
  const { dateInscription, id, password } = user;
  return password + id + dateInscription + tokenSalt;
};

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check params
  const password = req.param('password');

  if (!password) {
    return res.badRequest('You must provide a password.');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.badRequest(
      `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
    );
  }

  if (req.token) {
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
    // password update
    try {
      await TCaver.updateOne({
        id: req.token.id,
      }).set({
        password: createHashedPassword(password),
      });

      return res.ok();
    } catch (e) {
      return ErrorService.getDefaultErrorHandler(res)(e);
    }
  } else {
    const token = req.param('token');
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
      return res.notFound({
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
              'The password reset token signature is invalid.'
            );
          default:
            return res.serverError(
              'An unexpected error occured when verifying the password reset token.'
            );
        }
      }

      // Update password request
      await TCaver.updateOne({
        id: decodedToken.userId,
      }).set({
        password: createHashedPassword(password),
      });

      return res.ok();
    };
    TokenService.verify(token, verifyTokenCallback, resetPasswordSalt);
  }
};
