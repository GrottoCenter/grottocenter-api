let supertest = require('supertest');
let should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CAVE_PROPERTIES = require('./CAVE_PROPERTIES.js');

describe('Cave features', () => {
  describe('delete', () => {
    let userToken;
    before(async () => {
      sails.log.info('Asking for user auth token...');
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Missing parameters', () => {});
  });
});
