/* global AdminLoginProtectionService */
const should = require('should');
const sinon = require('sinon');
const LanguageService = require('../../../api/services/LanguageService');

/**
 * Helper: simulate N consecutive failed logins, refreshing the caver record
 * between each call (sequential by design — order matters).
 */
async function simulateFailures(caver, ip, count) {
  let current = caver;
  let result;
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    result = await AdminLoginProtectionService.recordFailedLogin(current, ip);
    // eslint-disable-next-line no-await-in-loop
    current = await TCaver.findOne({ id: caver.id });
  }
  return { result, caver: current };
}

/**
 * Helper: wait for fire-and-forget promises to settle.
 */
function tick(ms = 50) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('AdminLoginProtectionService - Email Notifications', () => {
  let sendEmailStub;
  let getLocaleStub;
  let logErrorStub;
  let logWarnStub;
  let adminCaver;

  before(async () => {
    // Fetch an admin caver from the test DB (caver with id 1 is admin)
    adminCaver = await TCaver.findOne({ id: 1 });
    should.exist(adminCaver);
  });

  beforeEach(async () => {
    getLocaleStub = sinon.stub(LanguageService, 'getLocale').resolves('en');
    logErrorStub = sinon.stub(sails.log, 'error');
    logWarnStub = sinon.stub(sails.log, 'warn');

    // Reset the admin caver's failure counters and email timestamp
    await TCaver.updateOne({ id: adminCaver.id }).set({
      loginFailedAttempts: 0,
      totpFailedAttempts: 0,
      lastFailedLoginAt: null,
      lastSuspiciousEmailAt: null,
      banned: false,
    });

    // Refresh the caver record
    adminCaver = await TCaver.findOne({ id: adminCaver.id });
  });

  afterEach(() => {
    if (sendEmailStub) {
      sendEmailStub.restore();
      sendEmailStub = null;
    }
    getLocaleStub.restore();
    logErrorStub.restore();
    logWarnStub.restore();
  });

  describe('Suspicious login email', () => {
    it('should send suspicious email after 3 consecutive failed logins', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      const ip = '192.168.1.100';
      await simulateFailures(adminCaver, ip, 3);
      await tick();

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      should(args.viewName).equal('suspiciousLogin');
      should(args.viewValues.failedAttempts).equal(3);
      should(args.viewValues.sourceIp).equal('192.168.1.100');
    });

    it('should NOT send suspicious email after only 2 failed logins', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      const ip = '10.0.0.1';
      await simulateFailures(adminCaver, ip, 2);
      await tick();

      should(sails.helpers.sendEmail.with.called).be.false();
    });

    it('should suppress duplicate emails within 15-minute cooldown', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      const ip = '172.16.0.1';

      // Trigger 3 failures to send first email
      await simulateFailures(adminCaver, ip, 3);
      await tick();

      should(sails.helpers.sendEmail.with.calledOnce).be.true();

      // Reset counter to simulate continued failures (but not ban)
      await TCaver.updateOne({ id: adminCaver.id }).set({
        loginFailedAttempts: 2,
      });
      adminCaver = await TCaver.findOne({ id: adminCaver.id });

      // 4th failure (counter now at 3 again) — within cooldown, should NOT send
      await AdminLoginProtectionService.recordFailedLogin(adminCaver, ip);
      await tick();

      // Still only one call — the second was suppressed by cooldown
      should(sails.helpers.sendEmail.with.callCount).equal(1);
    });

    it('should include correct IP, ISO 8601 timestamp, and failure count in email', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      const ip = '203.0.113.42';
      await simulateFailures(adminCaver, ip, 3);
      await tick();

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      const args = sails.helpers.sendEmail.with.firstCall.args[0];
      const { viewValues } = args;

      // Verify IP
      should(viewValues.sourceIp).equal('203.0.113.42');

      // Verify failure count
      should(viewValues.failedAttempts).equal(3);

      // Verify timestamp is ISO 8601 format
      should(viewValues.lastAttemptTime).be.a.String();
      const parsed = new Date(viewValues.lastAttemptTime);
      should(parsed.toISOString()).equal(viewValues.lastAttemptTime);
    });
  });

  describe('Ban email', () => {
    it('should send a distinct ban email (accountBanned) when account is banned', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().resolves(),
      });

      const ip = '10.20.30.40';

      // Trigger 5 failures to reach ban threshold
      await simulateFailures(adminCaver, ip, 5);
      await tick();

      // Should have sent suspicious email at 3 failures AND ban email at 5
      const calls = sails.helpers.sendEmail.with.getCalls();
      const banCall = calls.find((c) => c.args[0].viewName === 'accountBanned');
      should.exist(banCall, 'Expected an accountBanned email to be sent');
      should(banCall.args[0].viewName).equal('accountBanned');
      should(banCall.args[0].viewValues.sourceIp).equal('10.20.30.40');
    });
  });

  describe('Email failure handling', () => {
    it('should log error but not block login when email sending fails', async () => {
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().rejects(new Error('SES delivery failure')),
      });

      const ip = '192.168.0.1';

      // Trigger 3 failures — email will fail but recordFailedLogin resolves
      const { result } = await simulateFailures(adminCaver, ip, 3);
      should(result).have.property('banned');

      await tick();

      // Verify error was logged
      should(logErrorStub.called).be.true();
      const errorCall = logErrorStub
        .getCalls()
        .find((c) => c.args[0].includes('SES delivery failure'));
      should.exist(
        errorCall,
        'Expected error log containing "SES delivery failure"'
      );
    });
  });
});
