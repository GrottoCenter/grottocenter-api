const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const AuthTokenService = require('../AuthTokenService');
const TokenService = require('../../../api/services/TokenService');
const CommonService = require('../../../api/services/CommonService');

describe('Token blacklist middleware', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  afterEach(async () => {
    sails.services.blacklistservice.getCache().clear();
    await CommonService.query('DELETE FROM t_token_blacklist');
  });

  it('should reject a revoked token with 401', async () => {
    // First verify the token works
    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(200);

    // Decode the token to get the user ID
    const rawToken = userToken.replace('Bearer ', '');
    const decoded = await new Promise((resolve, reject) => {
      TokenService.verify(rawToken, (err, t) => {
        if (err) reject(err);
        else resolve(t);
      });
    });

    // Revoke the user's tokens
    await sails.services.blacklistservice.revoke(decoded.id);

    // The same token should now be rejected
    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(401);
  });

  it('should accept a token issued after revocation', async () => {
    // Decode the current token to get the user ID
    const rawToken = userToken.replace('Bearer ', '');
    const decoded = await new Promise((resolve, reject) => {
      TokenService.verify(rawToken, (err, t) => {
        if (err) reject(err);
        else resolve(t);
      });
    });

    // Revoke the user's tokens
    await sails.services.blacklistservice.revoke(decoded.id);

    // Wait 1 second so the fresh token's iat (whole seconds) is strictly
    // after the revoked_before timestamp, avoiding same-second ambiguity.
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });

    // Get a fresh token by logging in again
    const freshToken = await AuthTokenService.getRawBearerUserToken();

    // The fresh token should work
    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', freshToken)
      .set('Accept', 'application/json')
      .expect(200);
  });

  it('should reject a token missing iat with 401', async () => {
    // Issue a token without iat by using jwt.sign directly with noTimestamp
    const noIatToken = jwt.sign(
      { id: 1, groups: [], nickname: 'test' },
      TokenService.tokenSalt,
      { noTimestamp: true, expiresIn: 3600, subject: 'Authentication' }
    );

    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', `Bearer ${noIatToken}`)
      .set('Accept', 'application/json')
      .expect(401);
  });
});
