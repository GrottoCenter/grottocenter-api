const should = require('should');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const MfaService = require('../../../../api/services/MfaService');
const { generateCode } = require('../../../helpers/totp');

const ADMIN_EMAIL = 'admin1@admin1.com';
const ADMIN_PASSWORD = 'testtest';
const DEV_SECRET = 'JBSWY3DPEHPK3PXP';
const ADMIN_ID = 1;

describe('Auth features', () => {
  describe('Admin-specific token TTL', () => {
    const TEN_DAYS = 864000;
    const NINETY_DAYS = 7776000;

    beforeEach(async () => {
      // Set up MFA for admin so login can succeed with a TOTP code
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

    it('should issue a token that expires in ~10 days for an admin user', async () => {
      const totpCode = await generateCode();
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, totpCode })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('token');
      const decoded = jwt.decode(res.body.token);
      should(decoded).have.property('exp');
      should(decoded).have.property('iat');
      const ttl = decoded.exp - decoded.iat;
      should(ttl).equal(TEN_DAYS);
    });

    it('should issue a token that expires in ~90 days for a non-admin user', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: 'user1@user1.com', password: 'testtest' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('token');
          const decoded = jwt.decode(res.body.token);
          should(decoded).have.property('exp');
          should(decoded).have.property('iat');
          const ttl = decoded.exp - decoded.iat;
          should(ttl).equal(NINETY_DAYS);
          return done();
        });
    });

    describe('when adminAuthTokenTTL is undefined', () => {
      let originalAdminAuthTokenTTL;

      before(() => {
        originalAdminAuthTokenTTL = sails.config.custom.adminAuthTokenTTL;
        delete sails.config.custom.adminAuthTokenTTL;
      });

      after(() => {
        sails.config.custom.adminAuthTokenTTL = originalAdminAuthTokenTTL;
      });

      it('should issue a 90-day token for an admin user', async () => {
        const totpCode = await generateCode();
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, totpCode })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(res.body).have.property('token');
        const decoded = jwt.decode(res.body.token);
        should(decoded).have.property('exp');
        should(decoded).have.property('iat');
        const ttl = decoded.exp - decoded.iat;
        should(ttl).equal(NINETY_DAYS);
      });
    });
  });
});
