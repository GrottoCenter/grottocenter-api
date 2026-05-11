const supertest = require('supertest');
const Fixted = require('fixted');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const TokenService = require('../../../../api/services/TokenService');

const fixted = new Fixted();
const fixtures = fixted.data;

describe('Account change-email', () => {
  let userToken;
  let userId;
  let userMail;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const token = userToken.split(' ')[1];
    const payload = await new Promise((resolve, reject) => {
      TokenService.verify(token, (err, decoded) => {
        if (err) return reject(err);
        return resolve(decoded);
      });
    });
    userId = payload.id;
    const user = await TCaver.findOne({ id: userId });
    userMail = user.mail;
  });

  describe('PATCH /api/v1/account/email', () => {
    it('should return 400 when missing email', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({})
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when new email is identical to current mail', async () => {
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: userMail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 409 when email is already in use (mail)', async () => {
      // Find another user's email from fixtures
      const otherUser = fixtures.tcaver.find((c) => c.mail !== userMail);
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: otherUser.mail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(409);
    });

    it('should store new email in pendingMail, activationCode and set mailIsValid to false', async () => {
      const newEmail = 'newemail@example.com';
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: newEmail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);

      const updatedUser = await TCaver.findOne({ id: userId });
      updatedUser.mail.should.equal(userMail);
      updatedUser.pendingMail.should.equal(newEmail);
      updatedUser.activationCode.should.be.a.String().and.not.empty();
      updatedUser.mailIsValid.should.be.false();
    });

    it('should overwrite previous pendingMail and activationCode on new request', async () => {
      const firstEmail = 'first@example.com';
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: firstEmail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);

      const firstUser = await TCaver.findOne({ id: userId });
      const firstCode = firstUser.activationCode;

      const secondEmail = 'second@example.com';
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: secondEmail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);

      const secondUser = await TCaver.findOne({ id: userId });
      secondUser.pendingMail.should.equal(secondEmail);
      secondUser.activationCode.should.be.a.String().and.not.empty();
      secondUser.activationCode.should.not.equal(firstCode);
    });

    it('should return 409 when email is already in use (pendingMail)', async () => {
      const secondUserToken =
        await AuthTokenService.getRawBearerModeratorToken();
      const sharedPendingEmail = 'shared-pending@example.com';

      // First user claims it
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: sharedPendingEmail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);

      // Second user tries to claim the SAME email - should get 409
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: sharedPendingEmail })
        .set('Authorization', secondUserToken)
        .set('Accept', 'application/json')
        .expect(409);

      // Clean up first user's pendingMail for other tests
      await TCaver.updateOne({ id: userId }).set({
        pendingMail: null,
        mailIsValid: true,
      });
    });

    it('should allow login with old email while email change is pending', async () => {
      const newEmail = 'pending-login@example.com';
      const userPassword = 'testtest'; // Standard password for fixtures

      // Initiate change
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: newEmail })
        .set('Authorization', userToken)
        .expect(204);

      // Try login with OLD email - should work
      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: userMail, password: userPassword })
        .expect(200);

      // Try login with NEW email - should fail
      await supertest(sails.hooks.http.app)
        .post('/api/v1/login')
        .send({ email: newEmail, password: userPassword })
        .expect(401);
    });

    it('should cancel pending email change if current email is submitted', async () => {
      // 1. Initiate a change
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: 'temporary@example.com' })
        .set('Authorization', userToken)
        .expect(204);

      // 2. Submit current email to cancel
      const res = await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: userMail })
        .set('Authorization', userToken)
        .expect(200);

      res.body.message.should.equal('Pending email change cancelled.');

      // 3. Verify database state
      const updatedUser = await TCaver.findOne({ id: userId });
      updatedUser.mail.should.equal(userMail);
      should(updatedUser.pendingMail).be.null();
      should(updatedUser.activationCode).be.null();
      updatedUser.mailIsValid.should.be.true();
    });
  });

  describe('GET /api/v1/verify-email', () => {
    it('should commit pending email change and clear pending fields', async () => {
      const newEmail = 'verified@example.com';
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: newEmail })
        .set('Authorization', userToken)
        .expect(204);

      const user = await TCaver.findOne({ id: userId });
      const code = user.activationCode;

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/verify-email?token=${code}`)
        .expect(200);

      const updatedUser = await TCaver.findOne({ id: userId });
      updatedUser.mail.should.equal(newEmail);
      should(updatedUser.pendingMail).be.null();
      should(updatedUser.activationCode).be.null();
      updatedUser.mailIsValid.should.be.true();
    });

    it('should return 409 and clear pendingMail if new email is taken by then', async () => {
      const newEmail = 'taken@example.com';
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: newEmail })
        .set('Authorization', userToken)
        .expect(204);

      const user = await TCaver.findOne({ id: userId });
      const code = user.activationCode;

      // Create another user with that email in the meantime
      await TCaver.create({
        mail: newEmail,
        nickname: 'TheStealer',
        mailIsValid: true,
        dateInscription: new Date(),
      });

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/verify-email?token=${code}`)
          .expect(409);

        const updatedUser = await TCaver.findOne({ id: userId });
        updatedUser.mail.should.equal(userMail);
        should(updatedUser.pendingMail).be.null();
        should(updatedUser.activationCode).be.null();
      } finally {
        await TCaver.destroy({ mail: newEmail });
      }
    });

    it('should handle signup verification (null pendingMail) correctly', async () => {
      const signupEmail = 'signup@example.com';
      const signupCode = 'signup-code-123';
      await TCaver.create({
        mail: signupEmail,
        nickname: 'Newbie',
        activationCode: signupCode,
        activated: false,
        mailIsValid: false,
        dateInscription: new Date(),
      });

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/verify-email?token=${signupCode}`)
          .expect(200);

        const updatedUser = await TCaver.findOne({ mail: signupEmail });
        updatedUser.mail.should.equal(signupEmail);
        should(updatedUser.pendingMail).be.null();
        updatedUser.activated.should.be.true();
        updatedUser.mailIsValid.should.be.true();
      } finally {
        await TCaver.destroy({ mail: signupEmail });
      }
    });
  });

  afterEach(async () => {
    // Restore user state
    if (userId) {
      await TCaver.updateOne({ id: userId }).set({
        mail: userMail,
        pendingMail: null,
        mailIsValid: true,
        activationCode: null,
      });
    }
  });
});
