/**
 * tokenAuth
 *
 * @module      :: Policy
 * @description :: JSON Web Token authentication
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // We delete the token from param to not mess with blueprints
  delete req.query.token;

  if (token) {
    TokenAuthService.verify(token, function(err, token) {
      if (err) {
        return res.forbidden('Invalid Token');
      }
      req.token = token; // This is the decrypted token or the payload you provided
      next();
    });
  }

  return res.forbidden('You are not permitted to perform this action.');
};
