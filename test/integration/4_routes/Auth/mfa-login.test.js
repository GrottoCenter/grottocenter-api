const should = require('should');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const MfaService = require('../../../../api/services/MfaService');
const { generateCode } = require('../../../helpers/totp');

const ADMIN_EMAIL = 'admin1@admin1.com';
const ADMIN_PASSWORD = 'testtest';
const NON_ADMIN_EMAIL = 'user1@user1.com';
const NON_ADMIN_PASSWORD = 'testtest';
const DEV_SECRET = 'JBSWY3DPEHPK3PXP';
const ADMIN_ID = 1;

describe('Auth features', () => {
  describe('MFA login', () => {
    describe('Admin with active MFA', () => {
      beforeEach(async () => {
        const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: true,
          totpSecret: encryptedSecret,
          totpFailedAttempts: 0,
          loginFailedAttempts: 0,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      afterEach(async () => {
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: false,
          totpSecret: null,
          totpFailedAttempts: 0,
          loginFailedAttempts: 0,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      it('should return 401 MfaRequired when no TOTP code is provided', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('status', 'MfaRequired');
            return done();
          });
      });

      it('should return 200 with token when a valid TOTP code is provided', async () => {
        const validCode = await generateCode();
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            totpCode: validCode,
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(res.body).have.property('status', 'Success');
        should(res.body).have.property('token');
        const decoded = jwt.decode(res.body.token);
        should(decoded).have.property('sub', 'Authentication');
      });

      it('should return 401 InvalidTotpCode when an invalid TOTP code is provided', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            totpCode: '000000',
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('status', 'InvalidTotpCode');
            return done();
          });
      });

      it('should return 401 TotpAlreadyUsed when a replayed TOTP code is provided', async () => {
        const validCode = await generateCode();

        // First login — should succeed and record the code
        const firstRes = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            totpCode: validCode,
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');

        should(firstRes.status).equal(200);
        should(firstRes.body).have.property('status', 'Success');

        // Second login with the same code — should be rejected as replay
        const secondRes = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            totpCode: validCode,
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');

        should(secondRes.status).equal(401);
        should(secondRes.body).have.property('status', 'TotpAlreadyUsed');
      });
    });

    describe('Admin without MFA', () => {
      beforeEach(async () => {
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: false,
          totpSecret: null,
          totpFailedAttempts: 0,
          loginFailedAttempts: 0,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      afterEach(async () => {
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: false,
          totpSecret: null,
          totpFailedAttempts: 0,
          loginFailedAttempts: 0,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      it('should return 401 MfaEnrollmentRequired with an enrollment token', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('status', 'MfaEnrollmentRequired');
            should(res.body).have.property('enrollmentToken');

            // Verify the enrollment token has 10-min TTL and subject 'MfaEnrollment'
            const decoded = jwt.decode(res.body.enrollmentToken);
            should(decoded).have.property('sub', 'MfaEnrollment');
            should(decoded).have.property('exp');
            should(decoded).have.property('iat');
            const ttl = decoded.exp - decoded.iat;
            should(ttl).equal(600); // 10 minutes
            return done();
          });
      });
    });

    describe('Non-admin login', () => {
      it('should return 200 with token without requiring MFA', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: NON_ADMIN_EMAIL, password: NON_ADMIN_PASSWORD })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('status', 'Success');
            should(res.body).have.property('token');
            return done();
          });
      });
    });
  });
});
