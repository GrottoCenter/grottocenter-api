const should = require('should');
const sinon = require('sinon');
const TurnstileService = require('../../../api/services/TurnstileService');

describe('TurnstileService', () => {
  let originalEnabled;
  let originalSecret;

  beforeEach(() => {
    originalEnabled = process.env.TURNSTILE_ENABLED;
    originalSecret = process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalEnabled === undefined) {
      delete process.env.TURNSTILE_ENABLED;
    } else {
      process.env.TURNSTILE_ENABLED = originalEnabled;
    }
    if (originalSecret === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY;
    } else {
      process.env.TURNSTILE_SECRET_KEY = originalSecret;
    }
    sinon.restore();
  });

  describe('isEnabled()', () => {
    it('should return false when TURNSTILE_ENABLED env var is absent', () => {
      delete process.env.TURNSTILE_ENABLED;
      should(TurnstileService.isEnabled()).be.false();
    });

    it('should return false when TURNSTILE_ENABLED is empty string', () => {
      process.env.TURNSTILE_ENABLED = '';
      should(TurnstileService.isEnabled()).be.false();
    });

    it('should return false when TURNSTILE_ENABLED is "false"', () => {
      process.env.TURNSTILE_ENABLED = 'false';
      should(TurnstileService.isEnabled()).be.false();
    });

    it('should return true when TURNSTILE_ENABLED is "true"', () => {
      process.env.TURNSTILE_ENABLED = 'true';
      should(TurnstileService.isEnabled()).be.true();
    });

    it('should return true when TURNSTILE_ENABLED is "TRUE"', () => {
      process.env.TURNSTILE_ENABLED = 'TRUE';
      should(TurnstileService.isEnabled()).be.true();
    });
  });

  describe('validateConfig()', () => {
    it('should throw when enabled without secret key', () => {
      process.env.TURNSTILE_ENABLED = 'true';
      delete process.env.TURNSTILE_SECRET_KEY;
      should(() => TurnstileService.validateConfig()).throw(
        'TURNSTILE_SECRET_KEY is required when TURNSTILE_ENABLED is set to true'
      );
    });

    it('should throw when enabled with empty secret key', () => {
      process.env.TURNSTILE_ENABLED = 'true';
      process.env.TURNSTILE_SECRET_KEY = '   ';
      should(() => TurnstileService.validateConfig()).throw(
        'TURNSTILE_SECRET_KEY is required when TURNSTILE_ENABLED is set to true'
      );
    });

    it('should not throw when disabled without secret key', () => {
      delete process.env.TURNSTILE_ENABLED;
      delete process.env.TURNSTILE_SECRET_KEY;
      should(() => TurnstileService.validateConfig()).not.throw();
    });

    it('should not throw when enabled with valid secret key', () => {
      process.env.TURNSTILE_ENABLED = 'true';
      process.env.TURNSTILE_SECRET_KEY = 'my-secret-key';
      should(() => TurnstileService.validateConfig()).not.throw();
    });
  });

  describe('verifyToken()', () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = 'test-secret-key';
    });

    it('should return CAPTCHA_MISSING when token is undefined', async () => {
      const result = await TurnstileService.verifyToken(undefined, '1.2.3.4');
      should(result).deepEqual({ pass: false, errorCode: 'CAPTCHA_MISSING' });
    });

    it('should return CAPTCHA_MISSING when token is null', async () => {
      const result = await TurnstileService.verifyToken(null, '1.2.3.4');
      should(result).deepEqual({ pass: false, errorCode: 'CAPTCHA_MISSING' });
    });

    it('should return CAPTCHA_MISSING when token is empty string', async () => {
      const result = await TurnstileService.verifyToken('', '1.2.3.4');
      should(result).deepEqual({ pass: false, errorCode: 'CAPTCHA_MISSING' });
    });

    it('should return CAPTCHA_MISSING when token is whitespace-only', async () => {
      const result = await TurnstileService.verifyToken('   ', '1.2.3.4');
      should(result).deepEqual({ pass: false, errorCode: 'CAPTCHA_MISSING' });
    });

    it('should return pass when Cloudflare responds success: true', async () => {
      sinon.stub(global, 'fetch').resolves({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const result = await TurnstileService.verifyToken(
        'valid-token',
        '1.2.3.4'
      );
      should(result).deepEqual({ pass: true, errorCode: null });
    });

    it('should return CAPTCHA_INVALID when Cloudflare responds success: false', async () => {
      sinon.stub(global, 'fetch').resolves({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      });

      const result = await TurnstileService.verifyToken(
        'invalid-token',
        '1.2.3.4'
      );
      should(result).deepEqual({ pass: false, errorCode: 'CAPTCHA_INVALID' });
    });

    it('should return CAPTCHA_SERVICE_UNAVAILABLE on network error', async () => {
      sinon.stub(global, 'fetch').rejects(new Error('Network error'));

      const result = await TurnstileService.verifyToken(
        'some-token',
        '1.2.3.4'
      );
      should(result).deepEqual({
        pass: false,
        errorCode: 'CAPTCHA_SERVICE_UNAVAILABLE',
      });
    });

    it('should return CAPTCHA_SERVICE_UNAVAILABLE on HTTP 5xx response', async () => {
      sinon.stub(global, 'fetch').resolves({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const result = await TurnstileService.verifyToken(
        'some-token',
        '1.2.3.4'
      );
      should(result).deepEqual({
        pass: false,
        errorCode: 'CAPTCHA_SERVICE_UNAVAILABLE',
      });
    });

    it('should return CAPTCHA_SERVICE_UNAVAILABLE on timeout (AbortError)', async () => {
      const abortError = new DOMException(
        'The operation was aborted',
        'AbortError'
      );
      sinon.stub(global, 'fetch').rejects(abortError);

      const result = await TurnstileService.verifyToken(
        'some-token',
        '1.2.3.4'
      );
      should(result).deepEqual({
        pass: false,
        errorCode: 'CAPTCHA_SERVICE_UNAVAILABLE',
      });
    });
  });
});
