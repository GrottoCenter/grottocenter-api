const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('Unban', () => {
    let adminToken;
    let userToken;
    const targetCaverId = 3; // user1

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    afterEach(async () => {
      // Reset banned flag for target caver
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
    });

    it('should return 401 when no bearer token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/unban`)
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 403 when non-admin calls unban', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/unban`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when target caver does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/999999/unban')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200 when unbanning a banned caver', async () => {
      // First ban the caver
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/unban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned', false);

      // Verify in DB
      const caver = await TCaver.findOne({ id: targetCaverId });
      should(caver.banned).be.false();
    });

    it('should return 200 idempotent when unbanning a non-banned caver', async () => {
      // Ensure caver is not banned
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/unban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned', false);
    });
  });
});
