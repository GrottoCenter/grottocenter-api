/**
 * TokenService
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

const jwt = require('jsonwebtoken');
const AuthService = require('./AuthService');
const { tokenSalt } = AuthService;

// Generates a token from supplied payload
module.exports.issue = (
  payload,
  customTokenSalt = tokenSalt,
  expiresInHours,
  subject,
) =>
  jwt.sign(payload, customTokenSalt, {
    expiresIn: 60 * 60 * expiresInHours,
    subject: subject,
  });

// Verifies token on a request
module.exports.verify = (token, callback, customTokenSalt = tokenSalt) =>
  jwt.verify(
    token, // The token to be verified
    customTokenSalt, // Salt used to sign the token
    {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback, // Pass errors or decoded token to callback
  );
