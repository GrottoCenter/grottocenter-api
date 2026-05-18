const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Account change-password', () => {
  let userToken;
  let originalPasswordHash;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    // user1 has id=3 in fixtures
    const caver = await TCaver.findOne({ id: 3 });
    originalPasswordHash = caver.password;
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

    it('should return 400 when password lacks uppercase', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'new_password1!' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when password lacks special character', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'NewPassword123' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing token for reset', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'New_password1!' })
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should change password when authenticated', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'New_password1!' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);
    });
  });

  after(async () => {
    // Restore original password hash directly in DB (bypasses validation)
    await TCaver.updateOne({ id: 3 }).set({
      password: originalPasswordHash,
    });
  });
});
