const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('Get Banned', () => {
    let adminToken;
    let userToken;
    const targetCaverId = 3; // user1

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    afterEach(async () => {
      // Restore banned = false on test caver
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
    });

    it('should return 401 when no bearer token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 403 when non-admin calls get-banned', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 200 with empty banned array when no cavers are banned', async () => {
      // Ensure no cavers are banned
      await TCaver.update({ banned: true }).set({ banned: false });

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned');
      should(res.body.banned).be.an.Array();
      should(res.body.banned).have.length(0);
    });

    it('should return 200 with banned cavers, each having id and nickname', async () => {
      // Ban the target caver
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned');
      should(res.body.banned).be.an.Array();
      should(res.body.banned.length).be.greaterThanOrEqual(1);

      const bannedEntry = res.body.banned.find((c) => c.id === targetCaverId);
      should(bannedEntry).be.ok();
      should(bannedEntry).have.property('id', targetCaverId);
      should(bannedEntry).have.property('nickname');

      // Verify every entry has id and nickname
      res.body.banned.forEach((entry) => {
        should(entry).have.property('id');
        should(entry).have.property('nickname');
      });
    });
  });
});
