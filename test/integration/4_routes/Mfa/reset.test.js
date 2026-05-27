const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');
const MfaService = require('../../../../api/services/MfaService');

const ADMIN_ID = 1;
const ADMIN_EMAIL = 'admin1@admin1.com';
const DEV_SECRET = 'JBSWY3DPEHPK3PXP';

describe('MFA reset', () => {
  afterEach(async () => {
    // Reset MFA state for admin after each test
    await TCaver.updateOne({ id: ADMIN_ID }).set({
      totpSecret: null,
      mfaEnabled: false,
      totpFailedAttempts: 0,
      loginFailedAttempts: 0,
      lastUsedTotp: null,
      lastUsedTotpAt: null,
    });
  });

  describe('POST /api/v1/mfa/reset', () => {
    it('should return 200 and set mfaEnabled to false when called with valid token and password', async () => {
      // Set up MFA as active first
      const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: encryptedSecret,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });

      // Get a valid admin token (AuthTokenService handles MFA setup)
      const bearerToken = await AuthTokenService.getRawBearerAdminToken();

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .send({ password: AuthTokenService.TEST_PASSWORD })
        .set('Authorization', bearerToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('status', 'Success');
      should(res.body).have.property('message');

      // Verify mfaEnabled is now false in the database
      const caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.mfaEnabled).equal(false);
      should(caver.totpSecret).equal(null);
    });

    it('should require MFA enrollment on next login after reset', async () => {
      // Set up MFA as active first
      const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: encryptedSecret,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });

      // Get a valid admin token
      const bearerToken = await AuthTokenService.getRawBearerAdminToken();

      // Reset MFA
      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .send({ password: AuthTokenService.TEST_PASSWORD })
        .set('Authorization', bearerToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      // Now try to login — should get MfaEnrollmentRequired
      const loginRes = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({
          email: ADMIN_EMAIL,
          password: AuthTokenService.TEST_PASSWORD,
        })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      should(loginRes.body).have.property('status', 'MfaEnrollmentRequired');
      should(loginRes.body).have.property('enrollmentToken');
    });

    it('should return 401 when no token is provided', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .send({ password: AuthTokenService.TEST_PASSWORD })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);
    });

    it('should return 403 when called as non-admin', async () => {
      const bearerToken = await AuthTokenService.getRawBearerUserToken();

      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .send({ password: AuthTokenService.TEST_PASSWORD })
        .set('Authorization', bearerToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);
    });

    it('should return 400 when password is not provided', async () => {
      const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: encryptedSecret,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });

      const bearerToken = await AuthTokenService.getRawBearerAdminToken();

      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .set('Authorization', bearerToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 401 when wrong password is provided', async () => {
      const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: encryptedSecret,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });

      const bearerToken = await AuthTokenService.getRawBearerAdminToken();

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/reset')
        .send({ password: 'wrongpassword123' })
        .set('Authorization', bearerToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401);

      should(res.body).have.property('status', 'Mismatch');
      should(res.body).have.property('message', 'Invalid password.');
    });
  });
});
