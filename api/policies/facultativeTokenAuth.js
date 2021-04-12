/**
 * facultativeTokenAuth
 *
 * @module      :: Policy
 * @description :: Facultative JSON Web Token authentication. If there is no token provided, keep going.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7, authHeader.length);

  if (token) {
    TokenService.verify(token, (err, responseToken) => {
      if (err) {
        return res.forbidden('Invalid Token');
      }
      req.token = responseToken; // This is the decrypted token or the payload you provided
      return next();
    });
  } else {
    return next();
  }
};
