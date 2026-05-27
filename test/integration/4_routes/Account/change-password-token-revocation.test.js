const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');

const NEW_PASSWORD = 'New_password1!';
const ADMIN_CAVER_ID = 1; // admin1@admin1.com
const USER_CAVER_ID = 3; // user1@user1.com

describe('Change password - token revocation', () => {
  let originalAdminPasswordHash;
  let originalUserPasswordHash;

  before(async () => {
    const adminCaver = await TCaver.findOne({ id: ADMIN_CAVER_ID });
    originalAdminPasswordHash = adminCaver.password;

    const userCaver = await TCaver.findOne({ id: USER_CAVER_ID });
    originalUserPasswordHash = userCaver.password;
  });

  afterEach(async () => {
    // Restore original password hashes
    await TCaver.updateOne({ id: ADMIN_CAVER_ID }).set({
      password: originalAdminPasswordHash,
    });
    await TCaver.updateOne({ id: USER_CAVER_ID }).set({
      password: originalUserPasswordHash,
    });
    // Clean up blacklist entries
    sails.services.blacklistservice.getCache().delete(ADMIN_CAVER_ID);
    sails.services.blacklistservice.getCache().delete(USER_CAVER_ID);
    await CommonService.query(
      'DELETE FROM t_token_blacklist WHERE id_caver IN ($1, $2)',
      [ADMIN_CAVER_ID, USER_CAVER_ID]
    );
    sinon.restore();
  });

  it('should revoke tokens when admin changes password', async () => {
    const adminToken = await AuthTokenService.getRawBearerAdminToken();

    // Ensure no prior blacklist entry
    sails.services.blacklistservice.getCache().delete(ADMIN_CAVER_ID);

    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', adminToken)
      .set('Accept', 'application/json')
      .expect(204);

    // Wait for fire-and-forget revocation to complete
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    // Verify the cache has a revocation entry for the admin
    const cache = sails.services.blacklistservice.getCache();
    should(cache.has(ADMIN_CAVER_ID)).be.true();
    should(cache.get(ADMIN_CAVER_ID)).be.a.Date();

    // Verify the DB has the revocation record
    const dbResult = await CommonService.query(
      'SELECT revoked_before FROM t_token_blacklist WHERE id_caver = $1',
      [ADMIN_CAVER_ID]
    );
    should(dbResult.rows.length).equal(1);
  });

  it('should NOT revoke tokens when non-admin changes password', async () => {
    const userToken = await AuthTokenService.getRawBearerUserToken();

    // Ensure no prior blacklist entry
    sails.services.blacklistservice.getCache().delete(USER_CAVER_ID);

    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    // Wait to ensure no async revocation was triggered
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    // Verify no blacklist entry for the user
    const cache = sails.services.blacklistservice.getCache();
    should(cache.has(USER_CAVER_ID)).be.false();

    // Verify no DB record
    const dbResult = await CommonService.query(
      'SELECT revoked_before FROM t_token_blacklist WHERE id_caver = $1',
      [USER_CAVER_ID]
    );
    should(dbResult.rows.length).equal(0);
  });

  it('should succeed even when revocation fails', async () => {
    const adminToken = await AuthTokenService.getRawBearerAdminToken();

    // Ensure no prior blacklist entry so the token is valid
    sails.services.blacklistservice.getCache().delete(ADMIN_CAVER_ID);

    const revokeStub = sinon
      .stub(sails.services.blacklistservice, 'revoke')
      .rejects(new Error('DB connection lost'));
    const logErrorSpy = sinon.spy(sails.log, 'error');

    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', adminToken)
      .set('Accept', 'application/json')
      .expect(204);

    // Wait for the fire-and-forget .catch() to execute
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    should(revokeStub.calledOnce).be.true();
    should(logErrorSpy.called).be.true();
    const errorLogCall = logErrorSpy.args.find(
      (args) =>
        typeof args[0] === 'string' &&
        args[0].includes('Failed to revoke tokens for admin caver')
    );
    should(errorLogCall).not.be.undefined();
  });

  it('should reject old token after admin password change revocation', async () => {
    const adminToken = await AuthTokenService.getRawBearerAdminToken();

    // Ensure no prior blacklist entry so the token is valid
    sails.services.blacklistservice.getCache().delete(ADMIN_CAVER_ID);

    // First verify the admin token works on a protected endpoint
    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', adminToken)
      .set('Accept', 'application/json')
      .expect(200);

    // Change the admin password (triggers revocation)
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', adminToken)
      .set('Accept', 'application/json')
      .expect(204);

    // Wait for fire-and-forget revocation to complete
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    // The old token should now be rejected
    await supertest(sails.hooks.http.app)
      .get('/api/v1/cavers/1')
      .set('Authorization', adminToken)
      .set('Accept', 'application/json')
      .expect(401);
  });
});
