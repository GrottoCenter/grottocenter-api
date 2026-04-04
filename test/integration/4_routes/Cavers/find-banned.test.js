const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  describe('find() - isBanned field exposure', () => {
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

    it('should include isBanned=true for a banned caver when called by admin', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${targetCaverId}`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('isBanned', true);
    });

    it('should include isBanned=false for a non-banned caver when called by admin', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${targetCaverId}`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('isBanned', false);
    });

    it('should NOT include isBanned for a non-admin authenticated caver', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${targetCaverId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).not.have.property('isBanned');
    });

    it('should NOT include isBanned for an unauthenticated caller', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${targetCaverId}`)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).not.have.property('isBanned');
    });
  });
});
