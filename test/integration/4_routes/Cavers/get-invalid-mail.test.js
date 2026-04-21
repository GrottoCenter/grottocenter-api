const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('Get Invalid Mail', () => {
    let adminToken;
    let userToken;
    const targetCaverId = 3; // user1

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    afterEach(async () => {
      // Restore mailIsValid = true on test caver
      await TCaver.updateOne({ id: targetCaverId }).set({
        mailIsValid: true,
      });
    });

    it('should return 401 when no bearer token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/invalid-mail')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 403 when non-admin calls get-invalid-mail', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/invalid-mail')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 200 with empty cavers array when no cavers have invalid email', async () => {
      // Ensure all cavers have valid email
      await TCaver.update({ mailIsValid: false }).set({ mailIsValid: true });

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/invalid-mail')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('cavers');
      should(res.body.cavers).be.an.Array();
      should(res.body.cavers).have.length(0);
    });

    it('should return 200 with cavers that have mailIsValid false, each having id and nickname', async () => {
      // Mark the target caver as having invalid email
      await TCaver.updateOne({ id: targetCaverId }).set({
        mailIsValid: false,
      });

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/invalid-mail')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('cavers');
      should(res.body.cavers).be.an.Array();
      should(res.body.cavers.length).be.greaterThanOrEqual(1);

      const invalidEntry = res.body.cavers.find((c) => c.id === targetCaverId);
      should(invalidEntry).be.ok();
      should(invalidEntry).have.property('id', targetCaverId);
      should(invalidEntry).have.property('nickname');

      // Verify every entry has id and nickname (toListCaver shape)
      res.body.cavers.forEach((entry) => {
        should(entry).have.property('id');
        should(entry).have.property('nickname');
      });
    });
  });
});
