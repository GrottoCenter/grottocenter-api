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

  describe('Notification preferences', () => {
    describe('GET /api/v1/account/notifications', () => {
      it('should return code 200 with snake_case fields', (done) => {
        supertest(sails.hooks.http.app)
          .get('/api/v1/account/notifications')
          .set('Authorization', userToken)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.properties([
              'alert_for_news',
              'send_notification_by_email',
              'send_message_notification_by_email',
            ]);
            done();
            return null;
          });
      });
    });

    describe('PATCH /api/v1/account/notifications', () => {
      describe('Missing parameters', () => {
        it('should return code 400', (done) => {
          supertest(sails.hooks.http.app)
            .patch('/api/v1/account/notifications')
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(400, done);
        });
      });
      describe('Invalid alert_for_news parameter', () => {
        it('should return code 400', (done) => {
          supertest(sails.hooks.http.app)
            .patch('/api/v1/account/notifications')
            .send({ alert_for_news: 'change' })
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(400, done);
        });
      });
      describe('Success', () => {
        it('should return code 200 and update preferences', async () => {
          await supertest(sails.hooks.http.app)
            .patch('/api/v1/account/notifications')
            .send({
              alert_for_news: true,
              send_notification_by_email: true,
              send_message_notification_by_email: false,
            })
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .then((res) => {
              should(res.body.alert_for_news).be.true();
              should(res.body.send_notification_by_email).be.true();
              should(res.body.send_message_notification_by_email).be.false();
            });

          const caver = await TCaver.findOne({ nickname: 'User1' });
          caver.alertForNews.should.be.true();
          caver.sendNotificationByEmail.should.be.true();
          caver.sendMessageNotificationByEmail.should.be.false();
        });

        // Restore previous values
        after(async () => {
          await supertest(sails.hooks.http.app)
            .patch('/api/v1/account/notifications')
            .send({
              alert_for_news: false,
              send_notification_by_email: false,
              send_message_notification_by_email: true,
            })
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200);
        });
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
          language: '000',
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
          language: '000',
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
