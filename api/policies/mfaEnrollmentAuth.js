/**
 * mfaEnrollmentAuth
 *
 * @module      :: Policy
 * @description :: Validates that the request carries a restricted MFA enrollment token.
 *                 The token must have been parsed by the parseAuthToken middleware
 *                 and must have subject 'MfaEnrollment'. Full Auth_Tokens (subject
 *                 'Authentication') are rejected.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 */
module.exports = (req, res, next) => {
  if (!req.token) {
    return res.unauthorized(
      'Bearer token not found: you need to be authenticated to perform this action.'
    );
  }

  if (req.token.sub !== 'MfaEnrollment') {
    return res.unauthorized(
      'Invalid token: a valid MFA enrollment token is required.'
    );
  }

  return next();
};
