/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const TurnstileService = require('../../../api/services/TurnstileService');

// Require the controller directly to test defense ordering logic
const signUpController = require('../../../api/controllers/v1/auth/sign-up');

// --- Shared arbitraries ---

// Non-empty-after-trim strings (for Property 5)
const nonEmptyAfterTrim = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0);

// Arbitrary captcha tokens — may or may not be present
const arbitraryCaptchaToken = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 2048 })
);

/**
 * Property 5: Honeypot rejection short-circuits Turnstile verification
 *
 * For any request body with a `website` field containing at least one
 * non-whitespace character, the Turnstile verification function SHALL NOT
 * be invoked — regardless of the `captchaToken` value.
 *
 * Validates: Requirements 3.1, 3.2
 */
describe('Feature: signup-anti-bot-protection, Property 5: Honeypot rejection short-circuits Turnstile verification', () => {
  let verifyTokenStub;

  beforeEach(() => {
    verifyTokenStub = sinon.stub(TurnstileService, 'verifyToken').resolves({
      pass: true,
      errorCode: null,
    });
    sinon.stub(TurnstileService, 'isEnabled').returns(true);
    sinon.stub(sails.log, 'warn');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should never call TurnstileService.verifyToken when honeypot traps', async function () {
    this.timeout(30000);

    await fc.assert(
      fc.asyncProperty(
        nonEmptyAfterTrim,
        arbitraryCaptchaToken,
        async (website, captchaToken) => {
          // Reset call counts between iterations
          verifyTokenStub.resetHistory();

          const req = {
            body: { website, captchaToken },
            ip: '192.168.1.1',
            param: (name) => req.body[name],
          };

          let responseSent = false;
          const res = {
            ok: () => {
              responseSent = true;
            },
            status: () => res,
            json: () => res,
            badRequest: () => res,
            conflict: () => res,
          };

          await signUpController(req, res);

          // The honeypot should have intercepted and returned 200
          should(responseSent).be.true();

          // TurnstileService.verifyToken must NOT have been called
          should(verifyTokenStub.callCount).equal(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
