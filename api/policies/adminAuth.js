/**
 * adminAuth
 *
 * @module      :: Policy
 * @description :: Admin authentication.
 *      This policy assumes that there is a valid token in req.token
 *      which is the case when the request has been proceeded by the tokenAuth policy.
 *      So, use this policy ONLY after using the tokenAuth policy!
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
// eslint-disable-next-line consistent-return
module.exports = (req, res, next) => {
  const { token } = req;
  if (token.groups.some((g) => g.name === 'Administrator')) {
    next();
  } else {
    return res.forbidden(
      'You are not permitted to perform this action: you must be an administrator.',
    );
  }
};
