/**
 * apiKeyAuth
 *
 * @module      :: Policy
 * @description :: API key authentication
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  const apiKey = req.headers.authorization;
  if (apiKey) {
    if (apiKey !== 'TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQ=') {
      return res.forbidden('Invalid API key');
    }
  }
  next();
};
