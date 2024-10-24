/**
 * TokenService
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

const jwt = require('jsonwebtoken');

const tokenSalt = process.env.TOKEN_SALT
  ? process.env.TOKEN_SALT
  : 'aR4nd0mT0kenSalt';
module.exports.tokenSalt = tokenSalt;

// Generates a token from supplied payload
module.exports.issue = (
  payload,
  expiresInSeconds,
  subject,
  customTokenSalt = tokenSalt
) =>
  jwt.sign(payload, customTokenSalt, {
    expiresIn: expiresInSeconds,
    subject,
  });

// Verifies token on a request
module.exports.verify = (token, callback, customTokenSalt = tokenSalt) =>
  jwt.verify(
    token, // The token to be verified
    customTokenSalt, // Salt used to sign the token
    {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback // Pass errors or decoded token to callback
  );

module.exports.getResetPasswordTokenSalt = (user) => {
  const { dateInscription, id, password } = user;
  return password + id + dateInscription + tokenSalt;
};
