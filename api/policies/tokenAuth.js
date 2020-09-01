/**
 * tokenAuth
 *
 * @module      :: Policy
 * @description :: JSON Web Token authentication
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  const token =
    (req.body && req.body.token) ||
    req.query.token ||
    req.headers['x-access-token'];

  // We delete the token from param to not mess with blueprints
  delete req.query.token;

  if (token) {
    TokenAuthService.verify(token, (err, responseToken) => {
      if (err) {
        return res.forbidden('Invalid Token');
      }
      req.token = responseToken; // This is the decrypted token or the payload you provided
      return next();
    });
  } else {
    return res.forbidden('You are not permitted to perform this action.');
  }
};
