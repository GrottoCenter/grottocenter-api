const supertest = require('supertest');
const should = require('should');
const TokenService = require('../../../../api/services/TokenService');

const NEW_PASSWORD = 'newpassword123';
const targetCaverId = 3; // user1

describe('Account features', () => {
  describe('Change password - Banned caver', () => {
    let originalPasswordHash;

    beforeEach(async () => {
      const caver = await TCaver.findOne({ id: targetCaverId });
      originalPasswordHash = caver.password;
    });

    afterEach(async () => {
      // Restore banned flag and original password
      await TCaver.updateOne({ id: targetCaverId }).set({
        banned: false,
        password: originalPasswordHash,
      });
    });

    it('should return 403 with expired token message when a banned caver changes password via reset token', async () => {
      const userFound = await TCaver.findOne({ id: targetCaverId });
      const resetToken = TokenService.issue(
        { userId: userFound.id },
        sails.config.custom.passwordResetTokenTTL,
        'Reset password',
        TokenService.getResetPasswordTokenSalt(userFound)
      );

      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      const res = await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: NEW_PASSWORD, token: resetToken })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);

      should(res.body).have.property(
        'message',
        'The password reset token has expired.'
      );
    });

    it('should NOT change the password for a banned caver', async () => {
      const userFound = await TCaver.findOne({ id: targetCaverId });
      const resetToken = TokenService.issue(
        { userId: userFound.id },
        sails.config.custom.passwordResetTokenTTL,
        'Reset password',
        TokenService.getResetPasswordTokenSalt(userFound)
      );

      await TCaver.updateOne({ id: targetCaverId }).set({ banned: true });

      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: NEW_PASSWORD, token: resetToken })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);

      // Verify password hash is unchanged
      const caverAfter = await TCaver.findOne({ id: targetCaverId });
      should(caverAfter.password).equal(originalPasswordHash);
    });

    it('should allow a non-banned caver to change password via valid reset token (returns 204)', async () => {
      const userFound = await TCaver.findOne({ id: targetCaverId });
      const resetToken = TokenService.issue(
        { userId: userFound.id },
        sails.config.custom.passwordResetTokenTTL,
        'Reset password',
        TokenService.getResetPasswordTokenSalt(userFound)
      );

      await supertest(sails.hooks.http.app)
        .patch('/api/v1/account/password')
        .send({ password: NEW_PASSWORD, token: resetToken })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);
    });
  });
});
