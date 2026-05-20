const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../AuthTokenService');
const AuthService = require('../../../api/services/AuthService');

describe('Account features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Get account', () => {
    it('should return 200 with account details when authenticated', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/account')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200);
      should(res.body).have.property('id');
      should(res.body).have.property('nickname');
      should(res.body).have.property('name');
      should(res.body).have.property('surname');
      should(res.body).have.property('mail');
      should(res.body).have.property('language');
      should(res.body).have.property('mailIsValid');
      should(res.body).have.property('sendNotificationByEmail');
      should(res.body).have.property('mfaEnabled');
      should(res.body).not.have.property('password');
      should(res.body).not.have.property('activationCode');
    });

    it('should return 401 when no token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/account')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('Change email', () => {
    describe('Missing email parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account')
          .send({ email: '' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Invalid email parameter', () => {
      it('should return code 400', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account')
          .send({ email: 'invalidemail.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
    describe('Email already used by another caver', () => {
      it('should return code 409', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/account')
          .send({ email: 'admin1@admin1.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409, done);
      });
    });
    describe('Success', () => {
      it('should store email in pendingMail and return code 204', async () => {
        await supertest(sails.hooks.http.app)
          .patch('/api/v1/account')
          .send({ email: 'newmail@newmail.com' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
        const caver = await TCaver.findOne({ nickname: 'User1' });
        // Email is stored in pendingMail, not in mail directly
        caver.pendingMail.should.equal('newmail@newmail.com');
        caver.mail.should.equal('user1@user1.com');
        caver.mailIsValid.should.be.false();
      });
      // Restore user state
      after(async () => {
        await TCaver.updateOne({ nickname: 'User1' }).set({
          pendingMail: null,
          activationCode: null,
          mailIsValid: true,
        });
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

        it('should partially update notification preferences', async () => {
          // Reset preferences first to have a clean state for partial check
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

          await supertest(sails.hooks.http.app)
            .patch('/api/v1/account/notifications')
            .send({ alert_for_news: true })
            .set('Authorization', userToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .then((res) => {
              should(res.body.alert_for_news).be.true();
              should(res.body.send_notification_by_email).be.false();
              should(res.body.send_message_notification_by_email).be.true();
            });
        });

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

  describe('Update profile (name, surname, nickname)', () => {
    it('should update name and surname', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ name: 'NewName', surname: 'NewSurname' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
      const caver = await TCaver.findOne({ nickname: 'User1' });
      should(caver.name).equal('NewName');
      should(caver.surname).equal('NewSurname');
    });

    it('should update nickname', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ nickname: 'UpdatedUser1' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
      const caver = await TCaver.findOne({ id: 3 });
      should(caver.nickname).equal('UpdatedUser1');
    });

    it('should return 409 if nickname is already taken', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ nickname: 'Admin1' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(409);
    });

    it('should return 400 if nickname is empty', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ nickname: '' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should clear name when empty string is provided', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ name: '' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
      const caver = await TCaver.findOne({ id: 3 });
      should(caver.name).be.null();
    });

    it('should return 400 for unknown properties', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ unknownField: 'value' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 if body is empty', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    after(async () => {
      await TCaver.updateOne({ id: 3 }).set({
        name: 'Name1',
        surname: 'Surname1',
        nickname: 'User1',
      });
    });
  });

  describe('Update password via account endpoint', () => {
    it('should return 400 if currentPassword is not provided', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ password: 'New_password1!' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 403 if currentPassword is incorrect', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({
          password: 'New_password1!',
          currentPassword: 'wrongpassword',
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 if new password is too short', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ password: 'short', currentPassword: 'testtest' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 if new password lacks special character', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ password: 'NewPassword123', currentPassword: 'testtest' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should update password when currentPassword is correct', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ password: 'New_password1!', currentPassword: 'testtest' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
    });

    // Restore original password
    after(async () => {
      await TCaver.updateOne({ id: 3 }).set({
        password: await AuthService.createHashedPassword('testtest'),
      });
    });
  });

  describe('Update language', () => {
    it('should update language with a valid ISO 639-3 code', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ language: 'fra' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
      const caver = await TCaver.findOne({ id: 3 });
      should(caver.language).equal('fra');
    });

    it('should return 400 for an invalid language code', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account')
        .send({ language: 'zzz' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    // Restore original value
    after(async () => {
      await TCaver.updateOne({ id: 3 }).set({ language: '000' });
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
          .send({
            password: 'my_n3w-P4ssword',
            token: 'anInv4lidRand0mTok3n',
          })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
  });
});
