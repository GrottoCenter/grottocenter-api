/**
 * TokenAuthService
 *
 * @description :: JSON Webtoken Service for sails
 * @help        :: See https://github.com/auth0/node-jsonwebtoken & http://sailsjs.org/#!/documentation/concepts/Services
 */

const jwt = require('jsonwebtoken');

const tokenSecret = '54ff54rfyTE5656skfopkse564867fdcd54cdc534ef4se';

// Generates a token from supplied payload
module.exports.issue = (payload) =>
  jwt.sign(
    payload,
    tokenSecret, // Token Secret that we sign it with
    {
      expiresIn: 60 * 60 * 24,
    },
  );

// Verifies token on a request
module.exports.verify = (token, callback) =>
  jwt.verify(
    token, // The token to be verified
    tokenSecret, // Same token we used to sign
    {}, // No Option, for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback, // Pass errors or decoded token to callback
  );
