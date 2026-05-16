/* global AccountNotificationService */
const should = require('should');
const sinon = require('sinon');
const LanguageService = require('../../../api/services/LanguageService');

describe('AccountNotificationService', () => {
  let sendEmailStub;
  let getLocaleStub;
  let logErrorStub;

  beforeEach(() => {
    getLocaleStub = sinon.stub(LanguageService, 'getLocale');
    logErrorStub = sinon.stub(sails.log, 'error');
  });

  afterEach(() => {
    if (sendEmailStub) {
      sendEmailStub.restore();
      sendEmailStub = null;
    }
    getLocaleStub.restore();
    logErrorStub.restore();
  });

  describe('notifyEmailChanged()', () => {
    it('should call sendEmail with correct params', async () => {
      getLocaleStub.resolves('en');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyEmailChanged({
        oldEmail: 'old@example.com',
        nickname: 'TestUser',
        languageId: 1,
      });

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      should(args.viewName).equal('emailChanged');
      should(args.recipientEmail).equal('old@example.com');
      should(args.locale).equal('en');
      should(args.emailSubject).equal('Email Address Changed');
      should(args.allowResponse).equal(false);
      should(args.viewValues).have.property('recipientName', 'TestUser');
    });

    it('should fall back to default locale when LanguageService.getLocale returns undefined', async () => {
      getLocaleStub.resolves(undefined);
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyEmailChanged({
        oldEmail: 'old@example.com',
        nickname: 'TestUser',
        languageId: null,
      });

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      should(args.locale).equal(sails.config.i18n.defaultLocale);
    });

    it('should catch errors and log them without throwing', async () => {
      getLocaleStub.resolves('en');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().rejects(new Error('SES failure')),
      });

      await AccountNotificationService.notifyEmailChanged({
        oldEmail: 'old@example.com',
        nickname: 'TestUser',
        languageId: 1,
      });

      should(logErrorStub.calledOnce).be.true();
      should(logErrorStub.firstCall.args[0]).containEql('SES failure');
    });

    it('should not pass sensitive data in viewValues', async () => {
      getLocaleStub.resolves('en');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyEmailChanged({
        oldEmail: 'old@example.com',
        nickname: 'TestUser',
        languageId: 1,
      });

      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      const { viewValues } = args;
      should(viewValues).not.have.property('password');
      should(viewValues).not.have.property('token');
      should(viewValues).not.have.property('email');
      should(viewValues).not.have.property('oldEmail');
      should(viewValues).not.have.property('newEmail');
    });
  });

  describe('notifyPasswordChanged()', () => {
    it('should call sendEmail with correct params', async () => {
      getLocaleStub.resolves('de');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyPasswordChanged({
        email: 'user@example.com',
        nickname: 'CaveExplorer',
        languageId: 2,
      });

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      should(args.viewName).equal('passwordChanged');
      should(args.recipientEmail).equal('user@example.com');
      should(args.locale).equal('de');
      should(args.emailSubject).equal('Password Changed');
      should(args.allowResponse).equal(false);
      should(args.viewValues).have.property('recipientName', 'CaveExplorer');
    });

    it('should fall back to default locale when LanguageService.getLocale returns undefined', async () => {
      getLocaleStub.resolves(undefined);
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyPasswordChanged({
        email: 'user@example.com',
        nickname: 'CaveExplorer',
        languageId: null,
      });

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      should(args.locale).equal(sails.config.i18n.defaultLocale);
    });

    it('should catch errors and log them without throwing', async () => {
      getLocaleStub.resolves('en');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().rejects(new Error('Network timeout')),
      });

      await AccountNotificationService.notifyPasswordChanged({
        email: 'user@example.com',
        nickname: 'CaveExplorer',
        languageId: 1,
      });

      should(logErrorStub.calledOnce).be.true();
      should(logErrorStub.firstCall.args[0]).containEql('Network timeout');
    });

    it('should not pass sensitive data in viewValues', async () => {
      getLocaleStub.resolves('en');
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      await AccountNotificationService.notifyPasswordChanged({
        email: 'user@example.com',
        nickname: 'CaveExplorer',
        languageId: 1,
      });

      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      const { viewValues } = args;
      should(viewValues).not.have.property('password');
      should(viewValues).not.have.property('token');
      should(viewValues).not.have.property('email');
      should(viewValues).not.have.property('oldEmail');
      should(viewValues).not.have.property('newPassword');
    });
  });
});
