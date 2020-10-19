/**
 * adminAuth
 *
 * @module      :: Policy
 * @description :: Moderator authentication. This policy assumes that there is a valid token in req.token
 *                which is the case when the request has been proceeded by the tokenAuth policy.
 *                So, use this policy ONLY after using the tokenAuth policy!
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  const { token } = req;
  if (token.groups.some((g) => g.name === 'Moderator')) {
    next();
  } else {
    return res.forbidden(
      'You are not permitted to perform this action: you must be a moderator.',
    );
  }
};
