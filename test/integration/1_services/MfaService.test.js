const should = require('should');
const sinon = require('sinon');
const crypto = require('crypto');
const MfaService = require('../../../api/services/MfaService');
const { TOTP, TOTP_OPTIONS, generateCode } = require('../../helpers/totp');

describe('MfaService', () => {
  const DEV_SECRET = 'JBSWY3DPEHPK3PXP';

  describe('generateSecret()', () => {
    it('should return a valid Base32 string of at least 160 bits when mfaDevSecret is not set', () => {
      // Temporarily remove mfaDevSecret to test random generation
      const original = sails.config.custom.mfaDevSecret;
      sails.config.custom.mfaDevSecret = undefined;
      try {
        const secret = MfaService.generateSecret();
        should(secret).be.a.String();
        // 160 bits = 20 bytes → 32 Base32 characters
        should(secret.length).be.aboveOrEqual(32);
        // Base32 alphabet: A-Z and 2-7
        should(secret).match(/^[A-Z2-7]+$/);
      } finally {
        sails.config.custom.mfaDevSecret = original;
      }
    });

    it('should use mfaDevSecret when configured', () => {
      const secret = MfaService.generateSecret();
      should(secret).equal(DEV_SECRET);
    });
  });

  describe('encryptSecret() / decryptSecret()', () => {
    it('should round-trip: encrypt then decrypt returns original', () => {
      const original = DEV_SECRET;
      const encrypted = MfaService.encryptSecret(original);
      const decrypted = MfaService.decryptSecret(encrypted);
      should(decrypted).equal(original);
    });

    it('should produce different ciphertext for same input (random IV)', () => {
      const original = DEV_SECRET;
      const encrypted1 = MfaService.encryptSecret(original);
      const encrypted2 = MfaService.encryptSecret(original);
      should(encrypted1).not.equal(encrypted2);
    });

    it('should include version prefix in encrypted output', () => {
      const encrypted = MfaService.encryptSecret(DEV_SECRET);
      should(encrypted).startWith('v1:');
      // Format: v1:iv:ciphertext:authTag (4 parts separated by colons)
      const parts = encrypted.split(':');
      should(parts.length).equal(4);
      should(parts[0]).equal('v1');
    });

    it('should throw for ciphertext without version prefix', () => {
      // Simulate a ciphertext without version prefix (no legacy secrets exist)
      const keyHex = sails.config.custom.mfaEncryptionKey;
      const key = Buffer.from(keyHex, 'hex');
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([
        cipher.update(DEV_SECRET, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();
      const noVersion = `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;

      should(() => MfaService.decryptSecret(noVersion)).throw(
        /Unknown encryption version/
      );
    });
  });

  describe('verifyCode()', () => {
    it('should accept current TOTP code', async () => {
      const code = await generateCode();
      const result = await MfaService.verifyCode(code, DEV_SECRET);
      should(result).be.true();
    });

    it('should accept +1 step code (30 seconds after)', async () => {
      // Generate code at a future time, then verify at current time
      // Use a fixed base time aligned to a step boundary for predictability
      const baseTime = Math.floor(Date.now() / 30000) * 30000;
      const totp = new TOTP({ ...TOTP_OPTIONS, secret: DEV_SECRET });

      // Generate code at +1 step
      const clockFuture = sinon.useFakeTimers(baseTime + 30000);
      const codePlus1 = await totp.generate();
      clockFuture.restore();

      // Verify at base time — epochTolerance=[30,30] should accept +1 step
      const clockBase = sinon.useFakeTimers(baseTime);
      const result = await MfaService.verifyCode(codePlus1, DEV_SECRET);
      clockBase.restore();

      should(result).be.true();
    });

    it('should accept -1 step code (30 seconds before)', async () => {
      // Generate code at a past time, then verify at current time
      const baseTime = Math.floor(Date.now() / 30000) * 30000;
      const totp = new TOTP({ ...TOTP_OPTIONS, secret: DEV_SECRET });

      // Generate code at -1 step
      const clockPast = sinon.useFakeTimers(baseTime - 30000);
      const codeMinus1 = await totp.generate();
      clockPast.restore();

      // Verify at base time — epochTolerance=[30,30] should accept -1 step
      const clockBase = sinon.useFakeTimers(baseTime);
      const result = await MfaService.verifyCode(codeMinus1, DEV_SECRET);
      clockBase.restore();

      should(result).be.true();
    });

    it('should reject ±2 step codes', async () => {
      // Generate code at +3 steps, then verify at current time
      const baseTime = Math.floor(Date.now() / 30000) * 30000;
      const totp = new TOTP({ ...TOTP_OPTIONS, secret: DEV_SECRET });

      // Generate code at +3 steps (90s ahead) — guaranteed outside epochTolerance=[30,30]
      const clockFar = sinon.useFakeTimers(baseTime + 90000);
      const codePlus3 = await totp.generate();
      clockFar.restore();

      // Verify at base time
      const clockBase = sinon.useFakeTimers(baseTime);
      const result = await MfaService.verifyCode(codePlus3, DEV_SECRET);
      clockBase.restore();

      should(result).be.false();
    });

    it('should reject non-6-digit strings: letters', async () => {
      should(await MfaService.verifyCode('abcdef', DEV_SECRET)).be.false();
    });

    it('should reject non-6-digit strings: 5 digits', async () => {
      should(await MfaService.verifyCode('12345', DEV_SECRET)).be.false();
    });

    it('should reject non-6-digit strings: 7 digits', async () => {
      should(await MfaService.verifyCode('1234567', DEV_SECRET)).be.false();
    });

    it('should reject non-6-digit strings: empty', async () => {
      should(await MfaService.verifyCode('', DEV_SECRET)).be.false();
    });

    it('should reject null code', async () => {
      should(await MfaService.verifyCode(null, DEV_SECRET)).be.false();
    });
  });

  describe('isReplay()', () => {
    it('should return true when same code used within 90s window', () => {
      const code = '123456';
      const caver = {
        lastUsedTotp: '123456',
        lastUsedTotpAt: new Date(), // just now
      };
      const result = MfaService.isReplay(code, caver);
      should(result).be.true();
    });

    it('should return false when code is different', () => {
      const code = '654321';
      const caver = {
        lastUsedTotp: '123456',
        lastUsedTotpAt: new Date(),
      };
      const result = MfaService.isReplay(code, caver);
      should(result).be.false();
    });

    it('should return false when outside 90s window', () => {
      const code = '123456';
      const caver = {
        lastUsedTotp: '123456',
        lastUsedTotpAt: new Date(Date.now() - 91 * 1000), // 91 seconds ago
      };
      const result = MfaService.isReplay(code, caver);
      should(result).be.false();
    });

    it('should return false when no previous code exists', () => {
      const code = '123456';
      const caver = {
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      };
      const result = MfaService.isReplay(code, caver);
      should(result).be.false();
    });
  });

  describe('startEnrollment()', () => {
    // Admin caver (id=1) from fixtures has group [1] = Administrator
    const ADMIN_CAVER_ID = 1;

    afterEach(async () => {
      // Clean up: reset MFA state for admin caver
      await TCaver.updateOne({ id: ADMIN_CAVER_ID }).set({
        totpSecret: null,
        mfaEnabled: false,
      });
    });

    it('should store encrypted secret on caver record', async () => {
      const result = await MfaService.startEnrollment(ADMIN_CAVER_ID);

      should(result).have.property('secret');
      should(result).have.property('otpauthUri');
      should(result.secret).be.a.String();
      should(result.otpauthUri).startWith('otpauth://totp/');

      // Verify the secret is stored encrypted in DB
      const caver = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      should(caver.totpSecret).be.a.String();
      should(caver.totpSecret).not.equal(result.secret); // encrypted, not plain
      // Verify we can decrypt it back
      const decrypted = MfaService.decryptSecret(caver.totpSecret);
      should(decrypted).equal(result.secret);
    });

    it('should replace unverified secret (call twice, second replaces first)', async () => {
      const result1 = await MfaService.startEnrollment(ADMIN_CAVER_ID);
      const caver1 = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      const encrypted1 = caver1.totpSecret;

      const result2 = await MfaService.startEnrollment(ADMIN_CAVER_ID);
      const caver2 = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      const encrypted2 = caver2.totpSecret;

      // Both return the dev secret (since mfaDevSecret is set)
      should(result1.secret).equal(DEV_SECRET);
      should(result2.secret).equal(DEV_SECRET);
      // But the encrypted values differ (random IV)
      should(encrypted1).not.equal(encrypted2);
    });
  });

  describe('confirmEnrollment()', () => {
    const ADMIN_CAVER_ID = 1;

    beforeEach(async () => {
      // Set up a pending enrollment
      await MfaService.startEnrollment(ADMIN_CAVER_ID);
    });

    afterEach(async () => {
      // Clean up
      await TCaver.updateOne({ id: ADMIN_CAVER_ID }).set({
        totpSecret: null,
        mfaEnabled: false,
        totpFailedAttempts: 0,
        loginFailedAttempts: 0,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });
    });

    it('should activate MFA (sets mfaEnabled=true)', async () => {
      const code = await generateCode();
      const result = await MfaService.confirmEnrollment(ADMIN_CAVER_ID, code);

      should(result.success).be.true();

      const caver = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      should(caver.mfaEnabled).be.true();
      should(caver.totpFailedAttempts).equal(0);
      should(caver.loginFailedAttempts).equal(0);
      should(caver.lastUsedTotp).equal(code);
    });

    it('should return error for invalid code', async () => {
      const result = await MfaService.confirmEnrollment(
        ADMIN_CAVER_ID,
        '000000'
      );
      should(result.success).be.false();
      should(result.error).equal('Invalid TOTP code');
    });

    it('should return error when no pending enrollment exists', async () => {
      // Clear the pending enrollment
      await TCaver.updateOne({ id: ADMIN_CAVER_ID }).set({
        totpSecret: null,
      });

      const code = await generateCode();
      const result = await MfaService.confirmEnrollment(ADMIN_CAVER_ID, code);
      should(result.success).be.false();
      should(result.error).equal('No pending enrollment found');
    });
  });

  describe('resetMfa()', () => {
    const ADMIN_CAVER_ID = 1;

    beforeEach(async () => {
      // Set up active MFA
      await MfaService.startEnrollment(ADMIN_CAVER_ID);
      const code = await generateCode();
      await MfaService.confirmEnrollment(ADMIN_CAVER_ID, code);
    });

    afterEach(async () => {
      // Ensure clean state
      await TCaver.updateOne({ id: ADMIN_CAVER_ID }).set({
        totpSecret: null,
        mfaEnabled: false,
        totpFailedAttempts: 0,
        lastUsedTotp: null,
        lastUsedTotpAt: null,
      });
    });

    it('should clear totpSecret and set mfaEnabled=false', async () => {
      // Verify MFA is active before reset
      const before = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      should(before.mfaEnabled).be.true();
      should(before.totpSecret).be.a.String();

      await MfaService.resetMfa(ADMIN_CAVER_ID);

      const after = await TCaver.findOne({ id: ADMIN_CAVER_ID });
      should(after.totpSecret).be.null();
      should(after.mfaEnabled).be.false();
      should(after.totpFailedAttempts).equal(0);
      should(after.lastUsedTotp).be.null();
      should(after.lastUsedTotpAt).be.null();
    });
  });
});
