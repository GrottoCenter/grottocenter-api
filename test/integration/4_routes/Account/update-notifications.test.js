const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Account update - notifications', () => {
  let userToken;
  let notifyEmailChangedStub;
  let notifyPasswordChangedStub;
  let originalEmail;
  let originalPasswordHash;
  let AccountNotificationService;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    // user1 has id=3 in fixtures
    const caver = await TCaver.findOne({ id: 3 });
    originalEmail = caver.mail;
    originalPasswordHash = caver.password;
    // eslint-disable-next-line global-require
    AccountNotificationService = require('../../../../api/services/AccountNotificationService');
  });

  beforeEach(() => {
    notifyEmailChangedStub = sinon
      .stub(AccountNotificationService, 'notifyEmailChanged')
      .resolves();
    notifyPasswordChangedStub = sinon
      .stub(AccountNotificationService, 'notifyPasswordChanged')
      .resolves();
  });

  afterEach(async () => {
    notifyEmailChangedStub.restore();
    notifyPasswordChangedStub.restore();
    // Restore original email and password after each test
    await TCaver.updateOne({ id: 3 }).set({
      mail: originalEmail,
      password: originalPasswordHash,
      pendingMail: null,
      activationCode: null,
      mailIsValid: true,
    });
  });

  it('should trigger notifyEmailChanged with old email when email change is verified', async () => {
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .send({ email: 'newemail@example.com' })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyEmailChangedStub.called).be.false();

    const caver = await TCaver.findOne({ id: 3 });
    const code = caver.activationCode;

    await supertest(sails.hooks.http.app)
      .get(`/api/v1/verify-email?token=${code}`)
      .expect(200);

    should(notifyEmailChangedStub.calledOnce).be.true();
    const args = notifyEmailChangedStub.firstCall.args[0];
    should(args.oldEmail).equal(originalEmail);
    should(args).have.property('nickname');
    should(args).have.property('languageId');
  });

  it('should trigger notifyPasswordChanged with current email when password is updated', async () => {
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .send({
        password: 'New_password1!',
        currentPassword: AuthTokenService.TEST_PASSWORD,
      })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyPasswordChangedStub.calledOnce).be.true();
    const args = notifyPasswordChangedStub.firstCall.args[0];
    should(args.email).equal(originalEmail);
    should(args).have.property('nickname');
    should(args).have.property('languageId');
  });

  it('should send password notification to old email immediately when both email and password change simultaneously, and email notification only upon verification', async () => {
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .send({
        email: 'simultaneous@example.com',
        password: 'New_password1!',
        currentPassword: AuthTokenService.TEST_PASSWORD,
      })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyEmailChangedStub.called).be.false();
    should(notifyPasswordChangedStub.calledOnce).be.true();

    const passwordArgs = notifyPasswordChangedStub.firstCall.args[0];
    should(passwordArgs.email).equal(originalEmail);

    const caver = await TCaver.findOne({ id: 3 });
    const code = caver.activationCode;

    await supertest(sails.hooks.http.app)
      .get(`/api/v1/verify-email?token=${code}`)
      .expect(200);

    should(notifyEmailChangedStub.calledOnce).be.true();
    const emailArgs = notifyEmailChangedStub.firstCall.args[0];
    should(emailArgs.oldEmail).equal(originalEmail);
  });

  it('should return 200 even when email change notification throws an error', async () => {
    notifyEmailChangedStub.restore();
    notifyEmailChangedStub = sinon
      .stub(AccountNotificationService, 'notifyEmailChanged')
      .rejects(new Error('Notification failure'));

    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .send({ email: 'failtest@example.com' })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    const caver = await TCaver.findOne({ id: 3 });
    const code = caver.activationCode;

    await supertest(sails.hooks.http.app)
      .get(`/api/v1/verify-email?token=${code}`)
      .expect(200);
  });

  it('should NOT trigger notifications when updating non-email/non-password fields', async () => {
    await supertest(sails.hooks.http.app)
      .patch('/api/v1/account')
      .send({ name: 'UpdatedName' })
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(204);

    should(notifyEmailChangedStub.called).be.false();
    should(notifyPasswordChangedStub.called).be.false();
  });
});
