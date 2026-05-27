const should = require('should');
const supertest = require('supertest');
const { authenticator } = require('otplib');
const AuthService = require('../../../api/services/AuthService');
const MfaService = require('../../../api/services/MfaService');

describe('Auth features', () => {
  describe('Login', () => {
    describe('Email missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Password missing', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'unknown@test.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Bad email', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'bad_email', password: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Bad password', () => {
      it('should return code 401', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'test@test.com', password: 'bad_password' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Good credentials', () => {
      const ADMIN_ID = 1;
      const DEV_SECRET = 'JBSWY3DPEHPK3PXP';

      before(async () => {
        const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: true,
          totpSecret: encryptedSecret,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      after(async () => {
        await TCaver.updateOne({ id: ADMIN_ID }).set({
          mfaEnabled: false,
          totpSecret: null,
          lastUsedTotp: null,
          lastUsedTotpAt: null,
        });
      });

      it('should return code 200', (done) => {
        const totpCode = authenticator.generate(DEV_SECRET);
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'admin1@admin1.com', password: 'testtest', totpCode })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
    describe('Account status (unverified / banned)', () => {
      before(async () => {
        await TCaver.create({
          mail: 'unverified_login@test.com',
          nickname: 'unverified_login',
          password: await AuthService.createHashedPassword('testtest'),
          activated: false,
        });
        await TCaver.create({
          mail: 'banned_login@test.com',
          nickname: 'banned_login',
          password: await AuthService.createHashedPassword('testtest'),
          activated: true,
          banned: true,
        });
        await TCaver.create({
          mail: 'banned_unverified_login@test.com',
          nickname: 'banned_unverified_login',
          password: await AuthService.createHashedPassword('testtest'),
          activated: false,
          banned: true,
        });
      });
      after(async () => {
        await TCaver.destroy({ mail: 'unverified_login@test.com' });
        await TCaver.destroy({ mail: 'banned_login@test.com' });
        await TCaver.destroy({ mail: 'banned_unverified_login@test.com' });
      });
      it('should return code 401 NotVerified', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'unverified_login@test.com', password: 'testtest' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            should(res.body).have.property('status', 'NotVerified');
            return done();
          });
      });
      it('should return code 401 with Mismatch status for banned account', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({ email: 'banned_login@test.com', password: 'testtest' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            should(res.body).have.property('status', 'Mismatch');
            return done();
          });
      });
      it('should return code 401 with Mismatch status for banned and unverified account', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/login')
          .send({
            email: 'banned_unverified_login@test.com',
            password: 'testtest',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            should(res.body).have.property('status', 'Mismatch');
            return done();
          });
      });
    });
  });

  describe('Verify Email', () => {
    before(async () => {
      await TCaver.create({
        mail: 'verify_email@test.com',
        nickname: 'verify_email_test',
        password: await AuthService.createHashedPassword('test'),
        activated: false,
        activationCode: 'valid_activation_code',
      });
      await TCaver.create({
        mail: 'already_verified@test.com',
        nickname: 'already_verified_test',
        password: await AuthService.createHashedPassword('test'),
        activated: true,
        activationCode: 'already_verified_code',
      });
    });
    after(async () => {
      await TCaver.destroy({ mail: 'verify_email@test.com' });
      await TCaver.destroy({ mail: 'already_verified@test.com' });
    });

    it('should return 400 if token is missing', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/verify-email')
        .expect(400, done);
    });

    it('should return 404 for invalid token', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/verify-email')
        .query({ token: 'invalid_code' })
        .expect(404, done);
    });

    it('should return 200 for valid token and activate the user', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/verify-email')
        .query({ token: 'valid_activation_code' })
        .expect(200);

      const user = await TCaver.findOne({ mail: 'verify_email@test.com' });
      should(user.activated).be.true();
      should(user.mailIsValid).be.true();
      should(user.activationCode).be.oneOf([null, '']);
    });

    it('should return 200 with already verified message if user is already activated', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/verify-email')
        .query({ token: 'already_verified_code' })
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          should(res.body).have.property(
            'message',
            'Account was already verified.'
          );
          return done();
        });
    });
  });

  describe('Resend Verification Email', () => {
    before(async () => {
      await TCaver.create({
        mail: 'resend_verify@test.com',
        nickname: 'resend_verify',
        password: await AuthService.createHashedPassword('testtest'),
        activated: false,
        mailIsValid: true,
        activationCode: 'valid_activation_code',
      });
      await TCaver.create({
        mail: 'invalid_mail@test.com',
        nickname: 'invalid_mail',
        password: await AuthService.createHashedPassword('testtest'),
        activated: false,
        mailIsValid: false,
        activationCode: 'valid_activation_code',
      });
    });
    after(async () => {
      await TCaver.destroy({ mail: 'resend_verify@test.com' });
      await TCaver.destroy({ mail: 'invalid_mail@test.com' });
    });

    it('should return 400 if email is missing', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/resend-verification-email')
        .expect(400, done);
    });

    it('should return 400 if email is marked as invalid', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/resend-verification-email')
        .send({ email: 'invalid_mail@test.com' })
        .expect(400, done);
    });

    it('should return 204 if user does not exist (returns ok silently)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/resend-verification-email')
        .send({ email: 'nobody9999@test.com' })
        .expect(204, done);
    });

    it('should return 204 if already verified (returns ok silently)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/resend-verification-email')
        .send({ email: 'admin1@admin1.com' })
        .expect(204, done);
    });

    it('should return 204 on success', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/resend-verification-email')
        .send({ email: 'resend_verify@test.com' })
        .expect(204, done);
    });
  });

  describe('Sign Up', () => {
    const newAccount1 = {
      email: 'newtest@newtest.com',
      nickname: 'NewTest',
      password: 'New_password1!',
    };
    const newAccount2 = {
      email: 'newtest2@newtest2.com',
      name: 'Bob',
      nickname: 'NewTest2',
      password: 'New_password1!',
      surname: 'Testuser',
    };
    describe('Email missing', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            nickname: 'NewTest',
            password: 'New_password1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Password missing', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'NewTest',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Password too short', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'NewTest',
            password: 'pass',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Nickname already used', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest@newtest.com',
            nickname: 'Admin1',
            password: 'New_password1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Minimal data', () => {
      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send(newAccount1)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
    describe('Complete data', () => {
      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send(newAccount2)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
    describe('Email conflict', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'admin1@admin1.com',
            nickname: 'NewTest3',
            password: 'New_password1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Nickname conflict', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/signup')
          .send({
            email: 'newtest2@newtest2.com',
            nickname: 'Admin1',
            password: 'New_password1!',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Verification properties', () => {
      it('should create an inactive user with an activation code', async () => {
        const account1 = await TCaver.findOne({ mail: 'newtest@newtest.com' });
        should(account1.activated).be.false();
        should(account1.activationCode).be.a.String().and.not.empty();
      });
    });

    after(async () => {
      await TCaver.destroyOne({ mail: newAccount1.email });
      await TCaver.destroyOne({ mail: newAccount2.email });
    });
  });
});
