const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Account change-password', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('PATCH /api/v1/account/password', () => {
    it('should return 400 when missing password', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({})
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when password too short', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'short' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing token for reset', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'newpassword123' })
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should change password when authenticated', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'newpassword123' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);
    });
  });

  after(async () => {
    // Restore original password
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: AuthTokenService.TEST_PASSWORD })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);
  });
});
