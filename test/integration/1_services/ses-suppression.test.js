const should = require('should');
const sinon = require('sinon');
const SesSuppressionService = require('../../../api/services/SesSuppressionService');
const { awsSesCli } = require('../../../config/awsSes');

describe('SesSuppressionService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('fetchSuppressedEmails', () => {
    it('should return an empty array when SES returns no suppressed destinations', async () => {
      sinon.stub(awsSesCli, 'send').resolves({
        SuppressedDestinationSummaries: [],
        NextToken: undefined,
      });

      const result = await SesSuppressionService.fetchSuppressedEmails();

      should(result).be.an.Array();
      should(result).have.length(0);
    });

    it('should stop pagination when maxPages limit is reached', async () => {
      // Stub send to always return a NextToken (infinite pagination)
      const sendStub = sinon.stub(awsSesCli, 'send').callsFake(() =>
        Promise.resolve({
          SuppressedDestinationSummaries: [
            {
              EmailAddress: 'page@test.com',
              Reason: 'BOUNCE',
              LastUpdateTime: new Date(),
            },
          ],
          NextToken: 'always-more',
        })
      );
      const warnStub = sinon.stub(sails.log, 'warn');

      const result = await SesSuppressionService.fetchSuppressedEmails();

      // Should have stopped at 100 pages (MAX_PAGES)
      should(sendStub.callCount).equal(100);
      should(result).have.length(100);
      should(warnStub.calledWithMatch(/Hit max page limit/)).be.true(
        'Should warn about hitting the page limit'
      );
    });

    it('should return lowercase emails from a single-page response', async () => {
      sinon.stub(awsSesCli, 'send').resolves({
        SuppressedDestinationSummaries: [
          {
            EmailAddress: 'Alice@Example.COM',
            Reason: 'BOUNCE',
            LastUpdateTime: new Date(),
          },
          {
            EmailAddress: 'bob@test.org',
            Reason: 'COMPLAINT',
            LastUpdateTime: new Date(),
          },
        ],
        NextToken: undefined,
      });

      const result = await SesSuppressionService.fetchSuppressedEmails();

      should(result).be.an.Array();
      should(result).have.length(2);
      should(result).containDeep(['alice@example.com', 'bob@test.org']);
    });
  });

  describe('markCaversAsInvalid', () => {
    it('should return 0 when given an empty array', async () => {
      const result = await SesSuppressionService.markCaversAsInvalid([]);

      should(result).equal(0);
    });

    it('should return 0 when emails do not match any caver', async () => {
      const result = await SesSuppressionService.markCaversAsInvalid([
        'nonexistent-abc123@nowhere.test',
        'also-nonexistent-xyz789@nowhere.test',
      ]);

      should(result).equal(0);
    });
  });
});
