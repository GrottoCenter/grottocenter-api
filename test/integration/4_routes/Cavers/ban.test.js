const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('Ban', () => {
    let adminToken;
    let userToken;
    const targetCaverId = 3; // user1

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    afterEach(async () => {
      // Reset banned flag and clear blacklist cache for target caver
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
      sails.services.blacklistservice.getCache().delete(targetCaverId);
    });

    it('should return 401 when no bearer token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 403 when non-admin calls ban', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 403 when admin bans themselves', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/1/ban') // admin1 id=1
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('cannot ban yourself');
          return done();
        });
    });

    it('should return 404 when target caver does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/999999/ban')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200 when banning a non-banned caver', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('banned', true);
          return done();
        });
    });

    it('should return 200 idempotent when banning an already-banned caver', async () => {
      // First ban
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      // Second ban (idempotent)
      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned', true);
    });

    it('should revoke tokens after ban', async () => {
      sails.services.blacklistservice.getCache().delete(targetCaverId);

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${targetCaverId}/ban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      const iatBeforeBan = Math.floor(Date.now() / 1000) - 10;
      const isRevoked = sails.services.blacklistservice.isRevoked(
        targetCaverId,
        iatBeforeBan
      );
      should(isRevoked).be.true();
    });
  });
});
