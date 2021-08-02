/**
 * tokenAuth
 *
 * @module      :: Policy
 * @description :: JSON Web Token authentication. Check if a bearer token is present in req.token.
 *                  The token is put in req.token & verified by the parseAuthToken() middleware in the http.js file
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  if (req.token) {
    return next();
  }
  return res
    .status(401)
    .send(
      'Bearer token not found: you need to be authenticated to perform this action.',
    );
};
