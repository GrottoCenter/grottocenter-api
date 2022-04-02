const supertest = require('supertest');
const AuthTokenService = require('../AuthTokenService');

describe('Account features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
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
    describe('Missing alertForNews parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/alertForNews')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Invalid alertForNews parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/alertForNews')
          .send({ alertForNews: 'change' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Success', () => {
      it('should return code 204', async () => {
        await supertest(sails.hooks.http.app)
          .patch('/api/v1/account/alertForNews')
          .send({ alertForNews: 'true' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
        (
          await TCaver.findOne({
            nickname: 'User1',
          })
        ).alertForNews.should.be.true();
      });
      // Restore previous value
      after((done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account/alertForNews')
          .send({ alertForNews: 'false' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
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
