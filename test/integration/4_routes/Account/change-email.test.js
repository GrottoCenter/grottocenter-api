const supertest = require('supertest');
const Fixted = require('fixted');
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

    it('should store new email in pendingMail and set mailIsValid to false', async () => {
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
      updatedUser.mailIsValid.should.be.false();
    });

    it('should allow multiple users to claim the same pendingMail', async () => {
      const secondUserToken =
        await AuthTokenService.getRawBearerModeratorToken();
      const sharedPendingEmail = 'shared@example.com';

      // First user claims it
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: sharedPendingEmail })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(204);

      // Second user claims the SAME email
      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/email')
        .send({ email: sharedPendingEmail })
        .set('Authorization', secondUserToken)
        .set('Accept', 'application/json')
        .expect(204);

      // Verify both have it in pendingMail
      const user1 = await TCaver.findOne({ id: userId });
      user1.pendingMail.should.equal(sharedPendingEmail);

      const token2 = secondUserToken.split(' ')[1];
      const payload2 = await new Promise((resolve, reject) => {
        TokenService.verify(token2, (err, decoded) => {
          if (err) return reject(err);
          return resolve(decoded);
        });
      });
      const user2 = await TCaver.findOne({ id: payload2.id });
      user2.pendingMail.should.equal(sharedPendingEmail);

      // Clean up second user
      await TCaver.updateOne({ id: payload2.id }).set({
        pendingMail: null,
        mailIsValid: true,
      });
    });
  });

  after(async () => {
    // Restore user state
    if (userId) {
      await TCaver.updateOne({ id: userId }).set({
        pendingMail: null,
        mailIsValid: true,
      });
    }
  });
});
