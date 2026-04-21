const should = require('should');
const fc = require('fast-check');
const sinon = require('sinon');
const ejs = require('ejs');
const { SendEmailCommand } = require('@aws-sdk/client-sesv2');
const { awsSesCli } = require('../../../config/awsSes');

/**
 * Feature: ses-suppression-polling
 * Property 1: SES v2 email param construction preserves content
 *
 * For any valid email inputs (recipient address, subject string, HTML body,
 * allowResponse flag), the send-email helper SHALL construct SES v2 params
 * where Content.Simple.Subject.Data contains the subject,
 * Content.Simple.Body.Html.Data contains the HTML body,
 * Destination.ToAddresses contains the recipient, and FromEmailAddress
 * contains the correct sender address — with no v1 fields present.
 *
 * Validates: Requirements 1.4, 1.5
 */
describe('send-email helper - Property 1: SES v2 email param construction preserves content', () => {
  let FROM_ADDRESS;
  let INTERNAL_ADDRESS;
  let sendStub;
  let renderFileStub;

  before(() => {
    FROM_ADDRESS = sails.config.custom.fromEmailAddress;
    INTERNAL_ADDRESS = sails.config.custom.internalEmailAddress;
  });

  // Stub i18n.__ as a passthrough to prevent random subjects from polluting
  // locale files (Sails auto-adds unknown keys to config/locales/*.json).
  const i18nStub = { __: (s) => s };

  beforeEach(() => {
    sendStub = sinon.stub(awsSesCli, 'send').resolves({});
    sinon.stub(awsSesCli, 'areAwsCredentialsSet').resolves(true);
    renderFileStub = sinon.stub(ejs, 'renderFile');
  });

  afterEach(() => {
    sinon.restore();
  });

  // Arbitrary for a simple email-like string
  const emailArb = fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]{1,10}$/),
      fc.stringMatching(/^[a-z0-9]{1,10}$/)
    )
    .map(([local, domain]) => `${local}@${domain}.com`);

  const subjectArb = fc.string({ minLength: 1, maxLength: 100 });
  const htmlBodyArb = fc.string({ minLength: 1, maxLength: 500 });
  const allowResponseArb = fc.boolean();

  it('should construct v2 params that preserve all input content', function () {
    this.timeout(30000);

    fc.assert(
      fc.asyncProperty(
        emailArb,
        subjectArb,
        htmlBodyArb,
        allowResponseArb,
        async (recipientEmail, subject, htmlBody, allowResponse) => {
          sendStub.resetHistory();
          renderFileStub.resolves(htmlBody);

          await sails.helpers.sendEmail.with({
            recipientEmail,
            emailSubject: subject,
            viewName: 'forgotPassword',
            allowResponse,
            i18n: i18nStub,
          });

          should(sendStub.calledOnce).be.true(
            'awsSesCli.send should be called exactly once'
          );

          const command = sendStub.firstCall.args[0];
          should(command).be.instanceOf(SendEmailCommand);

          const params = command.input;

          // Verify v2 structure is used (no v1 fields)
          should(params).have.propertyByPath(
            'Content',
            'Simple',
            'Subject',
            'Data'
          );
          should(params).have.propertyByPath(
            'Content',
            'Simple',
            'Body',
            'Html',
            'Data'
          );
          should(params).have.property('FromEmailAddress');
          should(params).not.have.property('Source');
          should(params).not.have.property('Message');
          should(params).not.have.property('ReplyToAddresses');

          // Verify content preservation
          const expectedSubject = `Grottocenter - ${subject}`;
          should(params.Content.Simple.Subject.Data).equal(expectedSubject);
          should(params.Content.Simple.Body.Html.Data).equal(htmlBody);
          should(params.Destination.ToAddresses).deepEqual([recipientEmail]);

          // Verify correct sender based on allowResponse flag
          const expectedFrom = allowResponse ? INTERNAL_ADDRESS : FROM_ADDRESS;
          should(params.FromEmailAddress).equal(expectedFrom);
        }
      ),
      { numRuns: 100 }
    );
  });
});
