/**
 * Development environment overrides
 * (sails.config.custom)
 *
 * Settings here are merged into sails.config when NODE_ENV=development.
 */

module.exports = {
  custom: {
    // Deterministic TOTP secret for local development — avoids needing
    // a real authenticator app during dev/testing.
    mfaDevSecret: 'JBSWY3DPEHPK3PXP',

    // Distinguish dev tokens from production in authenticator apps.
    mfaIssuerName: 'Grottocenter (dev)',

    // Deterministic encryption key for local development.
    // In production, this MUST be set via the MFA_ENCRYPTION_KEY env var.
    mfaEncryptionKey:
      'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  },
};
