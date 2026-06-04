/**
 * Shared TOTP test helper — provides a configured TOTP instance
 * matching the MfaService configuration for generating test codes.
 */

const { TOTP } = require('otplib');
const MfaService = require('../../api/services/MfaService');

const { TOTP_OPTIONS } = MfaService;

const DEV_SECRET = 'JBSWY3DPEHPK3PXP';

/**
 * Pre-configured TOTP instance using the dev secret.
 * Use `await totp.generate()` to get a valid code.
 */
const totp = new TOTP({ ...TOTP_OPTIONS, secret: DEV_SECRET });

/**
 * Generate a valid TOTP code for the given secret (defaults to DEV_SECRET).
 * @param {string} [secret] - Base32-encoded secret (defaults to DEV_SECRET)
 * @returns {Promise<string>} 6-digit TOTP code
 */
async function generateCode(secret) {
  if (!secret || secret === DEV_SECRET) {
    return totp.generate();
  }
  const instance = new TOTP({ ...TOTP_OPTIONS, secret });
  return instance.generate();
}

module.exports = {
  TOTP,
  TOTP_OPTIONS,
  DEV_SECRET,
  totp,
  generateCode,
};
