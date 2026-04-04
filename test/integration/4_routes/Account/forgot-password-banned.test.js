const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

const targetCaverId = 3; // user1
const targetEmail = 'user1@user1.com';

describe('Account features', () => {
  describe('Forgot password - Banned caver', () => {
    beforeEach(() => {
      // Stub the sendEmail helper to track calls without actually sending
      // sails.helpers.sendEmail.with({...}).intercept(...) is the call pattern
      // We replace the entire helper with a stub that returns a chainable object
      sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().returns({
          intercept: sinon.stub().resolves(),
        }),
      });
    });

    afterEach(async () => {
      // Restore banned flag
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
      // Restore the original sendEmail helper
      sinon.restore();
    });

    it('should return 204 for a banned caver forgot-password request', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: targetEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
    });

    it('should not send email for a banned caver', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: targetEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      // sendEmail.with() should NOT have been called for banned caver
      should(sails.helpers.sendEmail.with.called).be.false();
    });

    it('should return 204 for a non-banned caver and send email', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });

      await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: targetEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      // sendEmail.with() should have been called for non-banned caver
      should(sails.helpers.sendEmail.with.called).be.true();
    });

    it('should return identical response for banned and non-banned cavers', async () => {
      // Banned request
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });
      const bannedRes = await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: targetEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      // Non-banned request
      await TCaver.updateOne({ id: targetCaverId }).set({ banned: false });
      const nonBannedRes = await supertest(sails.hooks.http.app)
        .post('/api/v1/forgotPassword')
        .send({ email: targetEmail })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      // Status codes should be identical
      should(bannedRes.status).equal(nonBannedRes.status);
      // Response bodies should be identical (both empty for 204)
      should(JSON.stringify(bannedRes.body)).equal(
        JSON.stringify(nonBannedRes.body)
      );
    });
  });
});
