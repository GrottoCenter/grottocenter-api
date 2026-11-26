const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const ACCOUNT_FIELDS = [
  'mail',
  'pendingMail',
  'mailIsValid',
  'activated',
  'mfaEnabled',
  'dateInscription',
  'dateLastConnection',
  'connectionCounter',
  'loginFailedAttempts',
  'lastFailedLoginAt',
  'totpFailedAttempts',
];
const SECRET_FIELDS = [
  'password',
  'activationCode',
  'totpSecret',
  'lastUsedTotp',
  'lastUsedTotpAt',
  'login',
  'lastSuspiciousEmailAt',
];

describe('Caver features', () => {
  describe('find() - account details exposure', () => {
    let adminToken;
    let userToken;
    // caver1: no test token logs in as this caver, so nothing rewrites its
    // dateLastConnection behind the test's back.
    const targetCaverId = 6;

    const get = (token) => {
      const req = supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${targetCaverId}`)
        .set('Accept', 'application/json');
      return (token ? req.set('Authorization', token) : req).expect(200);
    };

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    afterEach(async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({
        pendingMail: null,
        dateInscription: null,
        dateLastConnection: null,
        lastFailedLoginAt: null,
      });
    });

    it('should return every account field to an administrator', async () => {
      const lastLogin = new Date('2026-01-02T03:04:05.000Z');
      await TCaver.updateOne({ id: targetCaverId }).set({
        pendingMail: 'pending@example.com',
        dateInscription: lastLogin,
        dateLastConnection: lastLogin,
        lastFailedLoginAt: lastLogin,
      });

      const { body } = await get(adminToken);

      ACCOUNT_FIELDS.forEach((f) => should(body).have.property(f));
      should(body.mail).equal('caver1@caver1.com');
      should(body.pendingMail).equal('pending@example.com');
      should(body.mailIsValid).be.a.Boolean();
      should(body.activated).be.a.Boolean();
      should(body.mfaEnabled).be.a.Boolean();
      should(body.connectionCounter).be.a.Number();
      should(body.loginFailedAttempts).be.a.Number();
      should(body.totpFailedAttempts).be.a.Number();
      should(new Date(body.dateLastConnection).toISOString()).equal(
        lastLogin.toISOString()
      );
      should(new Date(body.dateInscription).toISOString()).equal(
        lastLogin.toISOString()
      );
    });

    it('should return empty nullable fields as null to an administrator', async () => {
      const { body } = await get(adminToken);

      should(body).have.property('pendingMail', null);
      should(body).have.property('dateLastConnection', null);
      should(body).have.property('lastFailedLoginAt', null);
    });

    it('should never return a secret, even to an administrator', async () => {
      const { body } = await get(adminToken);

      SECRET_FIELDS.forEach((f) => should(body).not.have.property(f));
    });

    it('should omit the account fields for a non-administrator', async () => {
      const { body } = await get(userToken);

      ACCOUNT_FIELDS.forEach((f) => should(body).not.have.property(f));
      SECRET_FIELDS.forEach((f) => should(body).not.have.property(f));
    });

    it('should omit the account fields for an anonymous caller', async () => {
      const { body } = await get();

      ACCOUNT_FIELDS.forEach((f) => should(body).not.have.property(f));
      SECRET_FIELDS.forEach((f) => should(body).not.have.property(f));
    });
  });
});
