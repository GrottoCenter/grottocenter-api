const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');
const TokenService = require('../../../../api/services/TokenService');

const NEW_PASSWORD = 'New_password1!';
const targetCaverId = 3; // user1

describe('Change password - notifications', () => {
  let userToken;
  let notifyPasswordChangedStub;
  let originalPasswordHash;
  let AccountNotificationService;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const caver = await TCaver.findOne({ id: targetCaverId });
    originalPasswordHash = caver.password;
    // eslint-disable-next-line global-require
    AccountNotificationService = require('../../../../api/services/AccountNotificationService');
  });

  beforeEach(() => {
    notifyPasswordChangedStub = sinon
      .stub(AccountNotificationService, 'notifyPasswordChanged')
      .resolves();
  });

  afterEach(async () => {
    notifyPasswordChangedStub.restore();
    // Restore original password hash so subsequent tests work
    await TCaver.updateOne({ id: targetCaverId }).set({
      password: originalPasswordHash,
    });
  });

  it('should trigger notifyPasswordChanged with correct email when authenticated', async () => {
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyPasswordChangedStub.calledOnce).be.true();
    const args = notifyPasswordChangedStub.firstCall.args[0];
    should(args.email).equal('user1@user1.com');
    should(args).have.property('nickname');
    should(args).have.property('languageId');
  });

  it('should trigger notifyPasswordChanged with correct email when using reset token', async () => {
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
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyPasswordChangedStub.calledOnce).be.true();
    const args = notifyPasswordChangedStub.firstCall.args[0];
    should(args.email).equal('user1@user1.com');
    should(args).have.property('nickname');
    should(args).have.property('languageId');
  });

  it('should return 204 even when notification throws an error', async () => {
    notifyPasswordChangedStub.restore();
    notifyPasswordChangedStub = sinon
      .stub(AccountNotificationService, 'notifyPasswordChanged')
      .rejects(new Error('Notification failure'));

    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account/password')
      .send({ password: NEW_PASSWORD })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);
  });
});
