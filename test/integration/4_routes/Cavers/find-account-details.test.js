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
        mfaEnabled: false,
        connectionCounter: 0,
        loginFailedAttempts: 0,
        totpFailedAttempts: 0,
        dateInscription: null,
        dateLastConnection: null,
        lastFailedLoginAt: null,
      });
    });

    it('should return every account field to an administrator', async () => {
      await TCaver.updateOne({ id: targetCaverId }).set({
        pendingMail: 'pending@example.com',
        mfaEnabled: true,
        connectionCounter: 7,
        loginFailedAttempts: 2,
        totpFailedAttempts: 1,
        dateInscription: new Date('2020-01-01T00:00:00.000Z'),
        dateLastConnection: new Date('2026-01-02T03:04:05.000Z'),
        lastFailedLoginAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const { body } = await get(adminToken);

      ACCOUNT_FIELDS.forEach((f) => should(body).have.property(f));
      should(body.mail).equal('caver1@caver1.com');
      should(body.pendingMail).equal('pending@example.com');
      should(body.mailIsValid).be.true(); // fixture
      should(body.activated).be.true(); // fixture
      should(body.mfaEnabled).be.true();
      should(body.connectionCounter).equal(7);
      should(body.loginFailedAttempts).equal(2);
      should(body.totpFailedAttempts).equal(1);
      should(new Date(body.dateInscription).toISOString()).equal(
        '2020-01-01T00:00:00.000Z'
      );
      should(new Date(body.dateLastConnection).toISOString()).equal(
        '2026-01-02T03:04:05.000Z'
      );
      should(new Date(body.lastFailedLoginAt).toISOString()).equal(
        '2026-01-01T00:00:00.000Z'
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
