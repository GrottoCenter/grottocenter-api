const should = require('should');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin1@admin1.com';
const ADMIN_PASSWORD = 'testtest';
const ADMIN_ID = 1;
const OTHER_CAVER_ID = 3;

const resetAdminMfa = () =>
  TCaver.updateOne({ id: ADMIN_ID }).set({
    mfaEnabled: false,
    totpSecret: null,
    totpFailedAttempts: 0,
    loginFailedAttempts: 0,
    lastUsedTotp: null,
    lastUsedTotpAt: null,
  });

const getEnrollmentToken = async () => {
  const res = await supertest(sails.hooks.http.app)
    .post('/api/v1/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect(401);
  should(res.body).have.property('status', 'MfaEnrollmentRequired');
  should(jwt.decode(res.body.enrollmentToken)).have.property(
    'sub',
    'MfaEnrollment'
  );
  return res.body.enrollmentToken;
};

describe('Auth features', () => {
  describe('MFA enrollment token scope', () => {
    let enrollmentToken;
    let authToken;

    beforeEach(async () => {
      await resetAdminMfa();
      enrollmentToken = await getEnrollmentToken();
      const { id, groups, nickname } = jwt.decode(enrollmentToken);
      authToken = sails.services.tokenservice.issue(
        { id, groups, nickname },
        60,
        'Authentication'
      );
    });

    afterEach(resetAdminMfa);

    it('should reject an enrollment token on an administrator-only tokenAuth route', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Authorization', `Bearer ${enrollmentToken}`)
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).not.have.property('banned');
    });

    it('should reject an enrollment token on a plain tokenAuth route', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/admins')
        .set('Authorization', `Bearer ${enrollmentToken}`)
        .set('Accept', 'application/json');

      should(res.status).equal(401);
      should(res.body).not.have.property('cavers');
    });

    it('should accept an Authentication token for the same administrator on the administrator-only route', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/banned')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('banned').which.is.an.Array();
    });

    it('should treat an enrollment token as anonymous on a public route with administrator-only fields', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${OTHER_CAVER_ID}`)
        .set('Authorization', `Bearer ${enrollmentToken}`)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('id', OTHER_CAVER_ID);
      should(res.body).not.have.property('isBanned');
    });

    it('should show administrator-only fields on the same public route to an Authentication token', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${OTHER_CAVER_ID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('isBanned', false);
    });

    it('should not let an enrollment token change the password without a reset token', async () => {
      const before = await TCaver.findOne({ id: ADMIN_ID });

      const res = await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: 'An0ther-Str0ng-Passw0rd!' })
        .set('Authorization', `Bearer ${enrollmentToken}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      const after = await TCaver.findOne({ id: ADMIN_ID });
      should(after.password).equal(before.password);
    });

    it('should still accept the enrollment token on the MFA enrollment route', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/mfa/enroll')
        .set('Authorization', `Bearer ${enrollmentToken}`)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('secret').which.is.a.String();
      should(res.body).have.property('otpauthUri').which.is.a.String();
    });
  });
});
