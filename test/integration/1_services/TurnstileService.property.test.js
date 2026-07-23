/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const TurnstileService = require('../../../api/services/TurnstileService');

// --- Shared arbitraries ---

// Whitespace-only strings (for Property 1)
const whitespaceOnly = fc
  .array(
    fc.constantFrom(' ', '\t', '\n', '\r', '\v', '\f', '\u00A0', '\u2003'),
    { minLength: 0, maxLength: 50 }
  )
  .map((chars) => chars.join(''));

// Case variations of "true" (for Property 6)
const caseTrue = fc.constantFrom(
  'true',
  'True',
  'TRUE',
  'tRuE',
  'truE',
  'tRUE'
);
const notTrue = fc.string().filter((s) => s.toLowerCase() !== 'true');

/**
 * Property 1: Missing or whitespace-only captchaToken is always rejected
 *
 * For any string composed entirely of whitespace characters (including the empty
 * string) or for undefined/null, the verifyToken function returns
 * { pass: false, errorCode: 'CAPTCHA_MISSING' }.
 *
 * Validates: Requirements 1.1
 */
describe('Feature: signup-anti-bot-protection, Property 1: Missing or whitespace-only captchaToken is always rejected', () => {
  it('should reject whitespace-only tokens with CAPTCHA_MISSING', async function () {
    this.timeout(30000);
    await fc.assert(
      fc.asyncProperty(whitespaceOnly, async (token) => {
        const result = await TurnstileService.verifyToken(token, '127.0.0.1');
        should(result.pass).be.false();
        should(result.errorCode).equal('CAPTCHA_MISSING');
      }),
      { numRuns: 100 }
    );
  });

  it('should reject empty string token with CAPTCHA_MISSING', async function () {
    this.timeout(30000);
    const result = await TurnstileService.verifyToken('', '127.0.0.1');
    should(result.pass).be.false();
    should(result.errorCode).equal('CAPTCHA_MISSING');
  });

  it('should reject undefined token with CAPTCHA_MISSING', async function () {
    this.timeout(30000);
    const result = await TurnstileService.verifyToken(undefined, '127.0.0.1');
    should(result.pass).be.false();
    should(result.errorCode).equal('CAPTCHA_MISSING');
  });

  it('should reject null token with CAPTCHA_MISSING', async function () {
    this.timeout(30000);
    const result = await TurnstileService.verifyToken(null, '127.0.0.1');
    should(result.pass).be.false();
    should(result.errorCode).equal('CAPTCHA_MISSING');
  });
});

/**
 * Property 2: Siteverify request body is correctly constructed
 *
 * For any valid captcha token string, secret key string, and IP address string,
 * the outbound POST body sent to Cloudflare contains all three values mapped to
 * the keys 'response', 'secret', and 'remoteip' respectively.
 *
 * Validates: Requirements 1.2
 */
describe('Feature: signup-anti-bot-protection, Property 2: Siteverify request body is correctly constructed', () => {
  let originalSecretKey;

  beforeEach(() => {
    originalSecretKey = process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    sinon.restore();
    if (originalSecretKey !== undefined) {
      process.env.TURNSTILE_SECRET_KEY = originalSecretKey;
    } else {
      delete process.env.TURNSTILE_SECRET_KEY;
    }
  });

  it('should POST correct body with secret, response, and remoteip', async function () {
    this.timeout(30000);

    // Token must be non-blank (whitespace-only tokens are rejected before fetch)
    const nonBlankToken = fc
      .string({ minLength: 1, maxLength: 2048 })
      .filter((s) => s.trim().length > 0);
    const secretKey = fc.string({ minLength: 1, maxLength: 100 });
    const ipAddress = fc.string({ minLength: 1, maxLength: 45 });

    await fc.assert(
      fc.asyncProperty(
        nonBlankToken,
        secretKey,
        ipAddress,
        async (token, secret, ip) => {
          process.env.TURNSTILE_SECRET_KEY = secret;

          const fetchStub = sinon.stub(global, 'fetch').resolves({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          });

          try {
            await TurnstileService.verifyToken(token, ip);

            should(fetchStub.calledOnce).be.true();

            const [url, options] = fetchStub.firstCall.args;
            should(url).equal(
              'https://challenges.cloudflare.com/turnstile/v0/siteverify'
            );
            should(options.method).equal('POST');
            should(options.headers['Content-Type']).equal(
              'application/x-www-form-urlencoded'
            );

            // Parse the URLSearchParams body to verify field values
            const body = new URLSearchParams(options.body.toString());
            should(body.get('secret')).equal(secret);
            should(body.get('response')).equal(token);
            should(body.get('remoteip')).equal(ip);
          } finally {
            fetchStub.restore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Only case-insensitive "true" enables Turnstile
 *
 * For any string value of TURNSTILE_ENABLED that is NOT case-insensitively equal
 * to "true", isEnabled() returns false. Conversely, for any case variation of
 * "true", it returns true.
 *
 * Validates: Requirements 4.2
 */
describe('Feature: signup-anti-bot-protection, Property 6: Only case-insensitive true enables Turnstile', () => {
  let originalEnabled;

  beforeEach(() => {
    originalEnabled = process.env.TURNSTILE_ENABLED;
  });

  afterEach(() => {
    if (originalEnabled !== undefined) {
      process.env.TURNSTILE_ENABLED = originalEnabled;
    } else {
      delete process.env.TURNSTILE_ENABLED;
    }
  });

  it('should return true for any case variation of "true"', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(caseTrue, (value) => {
        process.env.TURNSTILE_ENABLED = value;
        should(TurnstileService.isEnabled()).be.true();
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for any string that is not case-insensitively "true"', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(notTrue, (value) => {
        process.env.TURNSTILE_ENABLED = value;
        should(TurnstileService.isEnabled()).be.false();
      }),
      { numRuns: 100 }
    );
  });

  it('should return false when TURNSTILE_ENABLED is unset', function () {
    this.timeout(30000);
    delete process.env.TURNSTILE_ENABLED;
    should(TurnstileService.isEnabled()).be.false();
  });
});
