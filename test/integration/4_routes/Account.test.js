const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const AuthService = require('../../../api/services/AuthService');

describe('Account features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Change email', () => {
    describe('Missing email parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/email')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Invalid email parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/email')
          .send({ email: 'invalidemail.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Success', () => {
      it('should return code 204', async () => {
        await supertest(sails.hooks.http.app)
          .patch('/api/v1/account/email')
          .send({ email: 'newmail@newmail.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
        (await TCaver.findOne({ nickname: 'User1' })).mail.should.equal(
          'newmail@newmail.com'
        );
      });
      // Restore previous email
      after((done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/email')
          .send({ email: 'user1@user1.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });

  describe('Change alert for news', () => {
    describe('Missing parameters', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/notification-preferences')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Invalid alertForNews parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/notification-preferences')
          .send({ alertForNews: 'change' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Success', () => {
      it('should return code 200', async () => {
        await supertest(sails.hooks.http.app)
          .patch('/api/v1/account/notification-preferences')
          .send({ alertForNews: true })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        (
          await TCaver.findOne({
            nickname: 'User1',
          })
        ).alertForNews.should.be.true();
      });
      // Restore previous value
      after((done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/notification-preferences')
          .send({ alertForNews: false })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200, done);
      });
    });
  });

  describe('Forgot password', () => {
    describe('Missing email parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/forgotPassword')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Account from email not found', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/forgotPassword')
          .send({ email: 'invalid@email.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });
    describe('Unverified account', () => {
      before(async () => {
        await TCaver.create({
          mail: 'unverified_forgot@test.com',
          nickname: 'unverified_forgot',
          password: await AuthService.createHashedPassword('test'),
          activated: false,
        });
      });
      after(async () => {
        await TCaver.destroy({ mail: 'unverified_forgot@test.com' });
      });
      it('should return code 401 with NotVerified status', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/forgotPassword')
          .send({ email: 'unverified_forgot@test.com' })
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
    });
    describe('Banned account', () => {
      before(async () => {
        await TCaver.create({
          mail: 'banned_forgot@test.com',
          nickname: 'banned_forgot',
          password: await AuthService.createHashedPassword('test'),
          activated: true,
          banned: true,
        });
      });
      after(async () => {
        await TCaver.destroy({ mail: 'banned_forgot@test.com' });
      });
      it('should return code 204 silently', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/forgotPassword')
          .send({ email: 'banned_forgot@test.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
    describe('Success', () => {
      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/forgotPassword')
          .send({ email: 'user1@user1.com' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });

  describe('Change password', () => {
    describe('Missing password parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/password')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Missing token parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/password')
          .send({ password: 'my_n3w-P4ssword' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Invalid token', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/password')
          .send({ password: 'my_n3w-P4ssword', token: 'anInv4lidRand0mTok3n' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
  });
});
