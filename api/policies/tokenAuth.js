/**
 * tokenAuth
 *
 * @module      :: Policy
 * @description :: JSON Web Token authentication
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .send(
        'Bearer token not found: you need to be authenticated to perform this action.',
      );
  }

  const token = authHeader.substring(7, authHeader.length);

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
