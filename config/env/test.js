/**
 * Test environment overrides
 * (sails.config.custom)
 *
 * Settings here are merged into sails.config when NODE_ENV=test.
 */

module.exports = {
  custom: {
    // Skip the brute-force delay in tests — it adds 500ms per login
    // and the test suite makes dozens of login calls.
    authBruteForceDelay: 0,

    // Use minimal argon2 cost for password hashing in tests.
    // Fixture passwords are pre-hashed with m=4096,t=3,p=4 which is
    // already fast for verify(). This only affects hash() calls
    // (signup, password change).
    argon2Options: {
      memoryCost: 1024,
      timeCost: 1,
      parallelism: 1,
    },
  },
};
