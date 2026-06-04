/* eslint-disable no-await-in-loop */
const should = require('should');
const supertest = require('supertest');
const MfaService = require('../../../../api/services/MfaService');
const AuthTokenService = require('../../AuthTokenService');
const { generateCode } = require('../../../helpers/totp');

const ADMIN_EMAIL = 'admin1@admin1.com';
const ADMIN_PASSWORD = 'testtest';
const NON_ADMIN_EMAIL = 'user1@user1.com';
const NON_ADMIN_PASSWORD = 'testtest';
const DEV_SECRET = 'JBSWY3DPEHPK3PXP';
const ADMIN_ID = 1;

describe('Auth features', () => {
  describe('Admin account ban', () => {
    let adminToken;

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    afterEach(async () => {
      // Reset admin caver to clean state after each test
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        banned: false,
        loginFailedAttempts: 0,
        totpFailedAttempts: 0,
        mfaEnabled: false,
        totpSecret: null,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
        lastFailedLoginAt: null,
      });
    });

    it('should not ban admin after 4 failed logins', async () => {
      for (let i = 0; i < 4; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify admin is not banned
      const caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(false);
      should(caver.loginFailedAttempts).equal(4);
    });

    it('should ban admin after 5 failed logins', async () => {
      for (let i = 0; i < 5; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify admin is banned
      const caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(true);
      should(caver.loginFailedAttempts).equal(5);

      // 6th attempt should get generic mismatch (ban is hidden)
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).have.property('status', 'Mismatch');
      should(res.body).have.property('message', 'Invalid email or password.');
    });

    it('should return generic mismatch for banned admin', async () => {
      // Directly ban the admin
      await TCaver.updateOne({ id: ADMIN_ID }).set({ banned: true });

      // Attempt login with correct credentials
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).have.property('status', 'Mismatch');
      should(res.body).have.property('message', 'Invalid email or password.');
    });

    it('should reset counter on successful login before threshold', async () => {
      // 3 failed attempts
      for (let i = 0; i < 3; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify counter is at 3
      let caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.loginFailedAttempts).equal(3);

      // Successful login (admin without MFA gets MfaEnrollmentRequired which
      // still counts as successful credential validation and resets counters)
      const successRes = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      // Admin without MFA gets enrollment required (credentials were valid)
      should(successRes.status).equal(401);
      should(successRes.body).have.property('status', 'MfaEnrollmentRequired');

      // Counter should be reset
      caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.loginFailedAttempts).equal(0);

      // 3 more failed attempts should not trigger ban
      for (let i = 0; i < 3; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify not banned (only 3 consecutive failures after reset)
      caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(false);
      should(caver.loginFailedAttempts).equal(3);
    });

    it('should not affect non-admin accounts with 5+ failed logins', async () => {
      // 6 failed login attempts for non-admin
      for (let i = 0; i < 6; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: NON_ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Non-admin should still be able to login successfully
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: NON_ADMIN_EMAIL, password: NON_ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(200);
      should(res.body).have.property('status', 'Success');
      should(res.body).have.property('token');
    });

    it('should ban admin after 5 failed TOTP attempts', async () => {
      // Set up MFA for admin
      const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: encryptedSecret,
        totpFailedAttempts: 0,
        loginFailedAttempts: 0,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });

      // 5 failed TOTP attempts with wrong code
      for (let i = 0; i < 5; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            totpCode: '000000',
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify admin is banned
      const caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(true);
      should(caver.totpFailedAttempts).equal(5);

      // Next attempt with valid TOTP should get generic mismatch
      const validCode = await generateCode();
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          totpCode: validCode,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).have.property('status', 'Mismatch');
      should(res.body).have.property('message', 'Invalid email or password.');
    });

    it('should persist ban until manually unbanned', async () => {
      // Ban the admin via failed logins
      for (let i = 0; i < 5; i += 1) {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: 'wrongpassword' })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401);
      }

      // Verify banned
      let caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(true);

      // Attempt login with correct credentials — still banned
      let res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).have.property('status', 'Mismatch');

      // Unban via the unban endpoint (requires another admin)
      // We use the admin token obtained before the ban
      res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${ADMIN_ID}/unban`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json');

      should(res.status).equal(200);
      should(res.body).have.property('banned', false);

      // Verify unbanned in DB
      caver = await TCaver.findOne({ id: ADMIN_ID });
      should(caver.banned).equal(false);

      // Admin can now attempt login again (gets MfaEnrollmentRequired since MFA is not set up)
      res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).have.property('status', 'MfaEnrollmentRequired');
    });
  });
});
