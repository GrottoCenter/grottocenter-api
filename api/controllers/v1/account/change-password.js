const jwt = require('jsonwebtoken');

const AccountNotificationService = require('../../../services/AccountNotificationService');
const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  const password = req.param('password');

  if (!password) {
    return res.badRequest('You must provide a password.');
  }
  const validation = AuthService.validatePassword(password);
  if (!validation.valid) {
    return res.badRequest(validation.message);
  }

  if (req.token) {
    // password update
    await TCaver.updateOne({
      id: req.token.id,
    }).set({
      password: await AuthService.createHashedPassword(password),
    });

    const caver = await TCaver.findOne({ id: req.token.id });
    if (caver) {
      AccountNotificationService.notifyPasswordChanged({
        email: caver.mail,
        nickname: caver.nickname,
        languageId: caver.language,
      });
    }

    return res.ok();
  }
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

  // Block banned cavers — return same response as expired token to hide ban status
  if (userFound.banned === true) {
    sails.log.warn(
      `Banned caver ${userFound.id} attempted password change via reset token`
    );
    return res.forbidden('The password reset token has expired.');
  }

  // Check token
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
      password: await AuthService.createHashedPassword(password),
    });

    AccountNotificationService.notifyPasswordChanged({
      email: userFound.mail,
      nickname: userFound.nickname,
      languageId: userFound.language,
    });

    return res.ok();
  };

  TokenService.verify(
    token,
    verifyTokenCallback,
    TokenService.getResetPasswordTokenSalt(userFound)
  );
};
