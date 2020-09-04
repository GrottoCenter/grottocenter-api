/**
 * TokenAuthService
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

const jwt = require('jsonwebtoken');

const tokenSalt = process.env.TOKEN_SALT
  ? process.env.TOKEN_SALT
  : 'aR4nd0mT0kenSalt';

// Generates a token from supplied payload
module.exports.issue = (payload) =>
  jwt.sign(
    payload,
    tokenSalt, // Token Secret that we sign it with
    {
      expiresIn: 60 * 60 * 24,
    },
  );

// Verifies token on a request
module.exports.verify = (token, callback) =>
  jwt.verify(
    token, // The token to be verified
    tokenSalt, // Same token we used to sign
    {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback, // Pass errors or decoded token to callback
  );
