/**
 * MfaService
 *
 * @description :: Handles all MFA (TOTP) logic: secret generation, encryption,
 *                 verification, enrollment, and reset.
 */

const crypto = require('crypto');
const { authenticator } = require('otplib');

// Use a cloned instance to avoid mutating global otplib state.
const totpAuth = authenticator.clone();
totpAuth.options = {
  step: 30,
  window: 1,
  digits: 6,
  algorithm: 'sha1',
};

// Version prefix for encrypted secrets — allows future key rotation or
// algorithm changes without breaking existing ciphertexts.
const ENCRYPTION_VERSION = 'v1';

/**
 * Generate a TOTP secret. Uses mfaDevSecret config if set, otherwise
 * generates a cryptographically random 160-bit secret.
 * @returns {string} Base32-encoded secret
 */
function generateSecret() {
  const devSecret = sails.config.custom.mfaDevSecret;
  if (devSecret) {
    // Safety guard: only allow mfaDevSecret in development and test environments.
    // Any other environment (staging, qa, preview, production) is refused.
    const allowedEnvs = ['development', 'test'];
    const nodeEnv = process.env.NODE_ENV || '';
    const sailsEnv = sails.config.environment || '';
    if (allowedEnvs.includes(nodeEnv) || allowedEnvs.includes(sailsEnv)) {
      return devSecret;
    }
    sails.log.warn(
      `MfaService: mfaDevSecret is set in "${nodeEnv || sailsEnv}" environment — ignoring it for security.`
    );
  }
  // 20 bytes = 160 bits → 32 Base32 characters
  return totpAuth.generateSecret(20);
}

/**
 * Encrypt a TOTP secret for database storage using AES-256-GCM.
 * @param {string} plainSecret - Base32-encoded TOTP secret
 * @returns {string} Base64-encoded ciphertext (iv:ciphertext:authTag format)
 */
function encryptSecret(plainSecret) {
  const keyHex = sails.config.custom.mfaEncryptionKey;
  if (!keyHex) {
    throw new Error('MFA encryption key is not configured');
  }
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainSecret, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTION_VERSION}:${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
}

/**
 * Decrypt a stored TOTP secret.
 * @param {string} encryptedSecret - Base64-encoded ciphertext from DB (iv:ciphertext:authTag)
 * @returns {string} Base32-encoded TOTP secret
 */
function decryptSecret(encryptedSecret) {
  const keyHex = sails.config.custom.mfaEncryptionKey;
  if (!keyHex) {
    throw new Error('MFA encryption key is not configured');
  }
  const key = Buffer.from(keyHex, 'hex');

  const parts = encryptedSecret.split(':');

  if (parts[0] !== ENCRYPTION_VERSION) {
    throw new Error(
      `Unknown encryption version: "${parts[0]}". Expected "${ENCRYPTION_VERSION}".`
    );
  }

  // Versioned format: v1:iv:ciphertext:authTag
  const [, ivB64, encB64, tagB64] = parts;

  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
}

/**
 * Build the otpauth:// URI for QR code generation.
 * @param {string} secret - Base32-encoded TOTP secret
 * @param {string} email - Administrator's email
 * @returns {string} otpauth:// URI
 */
function buildOtpauthUri(secret, email) {
  const issuer = sails.config.custom.mfaIssuerName || 'Grottocenter';
  return totpAuth.keyuri(email, issuer, secret);
}

/**
 * Verify a TOTP code against a secret with ±1 step tolerance (30-second steps).
 * @param {string} code - 6-digit code from user
 * @param {string} secret - Base32-encoded TOTP secret (decrypted)
 * @returns {boolean}
 */
function verifyCode(code, secret) {
  if (!code || !/^\d{6}$/.test(code)) {
    return false;
  }
  return totpAuth.verify({ token: code, secret });
}

/**
 * Check if a TOTP code is a replay (same code used within 90s window).
 * @param {string} code - The TOTP code to check
 * @param {Object} caver - The caver record (with lastUsedTotp, lastUsedTotpAt)
 * @returns {boolean} true if replay detected
 */
function isReplay(code, caver) {
  if (!caver.lastUsedTotp || !caver.lastUsedTotpAt) {
    return false;
  }
  if (caver.lastUsedTotp !== code) {
    return false;
  }
  const lastUsedAt = new Date(caver.lastUsedTotpAt).getTime();
  const now = Date.now();
  const windowMs = 90 * 1000; // 90 seconds
  return now - lastUsedAt < windowMs;
}

/**
 * Start enrollment: generate secret, encrypt, store on caver record.
 * If a pending (unverified) secret exists, it is replaced.
 * @param {number} caverId
 * @returns {{ secret: string, otpauthUri: string }}
 */
async function startEnrollment(caverId) {
  const caver = await TCaver.findOne({ id: caverId }).populate('groups');
  if (!caver) {
    throw new Error(`Caver not found: ${caverId}`);
  }

  const secret = generateSecret();
  const encryptedSecret = encryptSecret(secret);

  await TCaver.updateOne({ id: caverId }).set({
    totpSecret: encryptedSecret,
  });

  const otpauthUri = buildOtpauthUri(secret, caver.mail);

  return { secret, otpauthUri };
}

/**
 * Confirm enrollment: verify code, activate MFA, reset failure counters.
 * @param {number} caverId
 * @param {string} code - 6-digit TOTP code
 * @returns {{ success: boolean, error?: string }}
 */
async function confirmEnrollment(caverId, code) {
  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return { success: false, error: 'Caver not found' };
  }

  if (!caver.totpSecret) {
    return { success: false, error: 'No pending enrollment found' };
  }

  const secret = decryptSecret(caver.totpSecret);
  const isValid = verifyCode(code, secret);

  if (!isValid) {
    return { success: false, error: 'Invalid TOTP code' };
  }

  // Store the enrollment code as lastUsedTotp to prevent immediate replay.
  // If the admin attempts a login with the same code within the 90s window,
  // it will be rejected as a replay. This is acceptable because /mfa/verify
  // already returns a full auth token, so a separate login is unnecessary.
  await TCaver.updateOne({ id: caverId }).set({
    mfaEnabled: true,
    totpFailedAttempts: 0,
    loginFailedAttempts: 0,
    lastUsedTotp: code,
    lastUsedTotpAt: new Date(),
  });

  return { success: true };
}

/**
 * Reset MFA for a caver: clear secret, set mfaEnabled=false.
 * @param {number} caverId
 * @returns {Promise<void>}
 */
async function resetMfa(caverId) {
  await TCaver.updateOne({ id: caverId }).set({
    totpSecret: null,
    mfaEnabled: false,
    totpFailedAttempts: 0,
    lastUsedTotp: null,
    lastUsedTotpAt: null,
  });
}

module.exports = {
  generateSecret,
  encryptSecret,
  decryptSecret,
  buildOtpauthUri,
  verifyCode,
  isReplay,
  startEnrollment,
  confirmEnrollment,
  resetMfa,
};
