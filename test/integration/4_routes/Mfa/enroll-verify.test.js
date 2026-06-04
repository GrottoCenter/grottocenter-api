const should = require('should');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const TokenService = require('../../../../api/services/TokenService');
const { generateCode } = require('../../../helpers/totp');

const ADMIN_ID = 1;
const ADMIN_EMAIL = 'admin1@admin1.com';
const NON_ADMIN_ID = 3; // user1

/**
 * Issue an MFA enrollment token for a given caver.
 */
const issueEnrollmentToken = (caverId, groups, nickname, ttl) =>
  TokenService.issue(
    { id: caverId, groups, nickname },
    ttl || sails.config.custom.mfaEnrollmentTokenTTL,
    'MfaEnrollment'
  );

/**
 * Issue a full authentication token for a given caver.
 */
const issueFullToken = (caverId, groups, nickname) =>
  TokenService.issue(
    { id: caverId, groups, nickname },
    sails.config.custom.adminAuthTokenTTL,
    'Authentication'
  );

describe('MFA Enrollment and Verification', () => {
  let adminGroups;
  let nonAdminGroups;

  before(async () => {
    const admin = await TCaver.findOne({ id: ADMIN_ID }).populate('groups');
    adminGroups = admin.groups;

    const nonAdmin = await TCaver.findOne({ id: NON_ADMIN_ID }).populate(
      'groups'
    );
    nonAdminGroups = nonAdmin.groups;
  });

  afterEach(async () => {
    // Reset MFA state for admin after each test
    await TCaver.updateOne({ id: ADMIN_ID }).set({
      totpSecret: null,
      mfaEnabled: false,
      totpFailedAttempts: 0,
      lastUsedTotp: null,
      lastUsedTotpAt: null,
    });
  });

  beforeEach(async () => {
    // Ensure admin starts with MFA disabled for enrollment tests
    await TCaver.updateOne({ id: ADMIN_ID }).set({
      totpSecret: null,
      mfaEnabled: false,
      totpFailedAttempts: 0,
      lastUsedTotp: null,
      lastUsedTotpAt: null,
    });
  });

  describe('POST /api/v1/mfa/enroll', () => {
    it('should return 200 with secret and otpauthUri for valid enrollment token', (done) => {
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1');

      supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('secret');
          should(res.body).have.property('otpauthUri');
          should(res.body.secret).be.a.String().and.not.empty();
          should(res.body.otpauthUri).be.a.String().and.not.empty();
          return done();
        });
    });

    it('should return 401 when using a full auth token (subject Authentication)', (done) => {
      const token = issueFullToken(ADMIN_ID, adminGroups, 'Admin1');

      supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 401 when using an expired enrollment token', (done) => {
      // Issue a token with 1-second TTL and wait for it to expire
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1', 1);

      setTimeout(() => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/mfa/enroll')
          .set('Authorization', `Bearer ${token}`)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      }, 1100);
    });

    it('should return 409 when MFA is already active', async () => {
      // Activate MFA for admin
      await TCaver.updateOne({ id: ADMIN_ID }).set({
        mfaEnabled: true,
        totpSecret: 'some-encrypted-secret',
      });

      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1');

      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(409);
    });

    it('should return 403 when user is not an admin', (done) => {
      const token = issueEnrollmentToken(NON_ADMIN_ID, nonAdminGroups, 'User1');

      supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should include correct issuer and admin email in otpauthUri', (done) => {
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1');

      supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { otpauthUri } = res.body;
          should(otpauthUri).startWith('otpauth://totp/');
          // Check issuer name from test config
          should(otpauthUri).containEql('Grottocenter%20(test)');
          // Check admin email is present
          should(otpauthUri).containEql(
            encodeURIComponent(ADMIN_EMAIL).replace(/%40/, '%40')
          );
          // Also verify via URL parsing
          const url = new URL(otpauthUri);
          should(url.searchParams.get('issuer')).equal('Grottocenter (test)');
          return done();
        });
    });
  });

  describe('POST /api/v1/mfa/verify', () => {
    it('should return 200 with full auth token for valid TOTP code', async () => {
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1');

      // First enroll
      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      // Generate a valid TOTP code using the dev secret
      const validCode = await generateCode();

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ totpCode: validCode })
        .expect(200);

      should(res.body).have.property('status', 'Success');
      should(res.body).have.property('token');
      should(res.body.token).be.a.String().and.not.empty();

      // Verify the issued token is a full auth token
      const decoded = jwt.decode(res.body.token);
      should(decoded).have.property('sub', 'Authentication');
      should(decoded).have.property('id', ADMIN_ID);
    });

    it('should return 401 with InvalidTotpCode for invalid code', async () => {
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1');

      // First enroll
      await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ totpCode: '000000' })
        .expect(401);

      should(res.body).have.property('status', 'InvalidTotpCode');
    });

    it('should return 401 when enrollment token has expired', (done) => {
      // Issue a token with 1-second TTL
      const token = issueEnrollmentToken(ADMIN_ID, adminGroups, 'Admin1', 1);

      // Wait for it to expire
      setTimeout(() => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/mfa/verify')
          .set('Authorization', `Bearer ${token}`)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .send({ totpCode: '123456' })
          .expect(401, done);
      }, 1100);
    });
  });
});
