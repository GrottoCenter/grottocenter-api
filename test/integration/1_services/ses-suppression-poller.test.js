const should = require('should');
const sinon = require('sinon');
const SesSuppressionService = require('../../../api/services/SesSuppressionService');
const { awsSesCli } = require('../../../config/awsSes');
const {
  pollSuppressionList,
} = require('../../../api/sesSuppressionPoller/sesSuppressionPoller');

describe('sesSuppressionPoller', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('pollSuppressionList', () => {
    it('should skip polling when no AWS credentials are configured', async () => {
      sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(false);
      const fetchStub = sinon.stub(
        SesSuppressionService,
        'fetchSuppressedEmails'
      );
      const logInfoStub = sinon.stub(sails.log, 'info');

      await pollSuppressionList();

      should(fetchStub.called).be.false(
        'fetchSuppressedEmails should not be called when credentials are missing'
      );
      should(
        logInfoStub.calledWith(
          '[sesSuppressionPoller] No AWS credentials configured, skipping'
        )
      ).be.true('Should log that credentials are missing');
    });

    it('should log error and not crash on SES API failure', async () => {
      sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(true);
      const sesError = new Error('SES API unavailable');
      sinon
        .stub(SesSuppressionService, 'fetchSuppressedEmails')
        .rejects(sesError);
      const logErrorStub = sinon.stub(sails.log, 'error');
      sinon.stub(sails.log, 'info');

      await pollSuppressionList();

      should(
        logErrorStub.calledWith(
          '[sesSuppressionPoller] Polling cycle error:',
          sesError
        )
      ).be.true('Should log the SES API error');
    });

    it('should log error and not crash on DB update failure', async () => {
      sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(true);
      sinon
        .stub(SesSuppressionService, 'fetchSuppressedEmails')
        .resolves(['bounce@example.com']);
      const dbError = new Error('Database connection lost');
      sinon.stub(SesSuppressionService, 'markCaversAsInvalid').rejects(dbError);
      const logErrorStub = sinon.stub(sails.log, 'error');
      sinon.stub(sails.log, 'info');

      await pollSuppressionList();

      should(
        logErrorStub.calledWith(
          '[sesSuppressionPoller] Polling cycle error:',
          dbError
        )
      ).be.true('Should log the DB error');
    });

    it('should log empty message when suppression list is empty', async () => {
      sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(true);
      sinon.stub(SesSuppressionService, 'fetchSuppressedEmails').resolves([]);
      const markStub = sinon.stub(SesSuppressionService, 'markCaversAsInvalid');
      const logInfoStub = sinon.stub(sails.log, 'info');

      await pollSuppressionList();

      should(markStub.called).be.false(
        'markCaversAsInvalid should not be called when list is empty'
      );
      should(
        logInfoStub.calledWith(
          '[sesSuppressionPoller] Suppression list is empty'
        )
      ).be.true('Should log that suppression list is empty');
    });

    it('should log start and complete messages with counts', async () => {
      sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(true);
      sinon
        .stub(SesSuppressionService, 'fetchSuppressedEmails')
        .resolves(['a@test.com', 'b@test.com', 'c@test.com']);
      sinon.stub(SesSuppressionService, 'markCaversAsInvalid').resolves(2);
      const logInfoStub = sinon.stub(sails.log, 'info');

      await pollSuppressionList();

      should(
        logInfoStub.calledWith('[sesSuppressionPoller] Starting polling cycle')
      ).be.true('Should log start message');
      should(
        logInfoStub.calledWith(
          '[sesSuppressionPoller] Polling cycle complete: 3 suppressed destinations, 2 cavers updated'
        )
      ).be.true('Should log complete message with correct counts');
    });
  });
});
