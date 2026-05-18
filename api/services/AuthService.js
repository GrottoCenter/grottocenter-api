const argon2 = require('argon2');
const util = require('util');
const crypto = require('crypto');

const setTimeoutP = util.promisify(setTimeout);

/**
 * GC3 hashing password algorithm (argon2id)
 * @param {String} password
 */
async function createHashedPassword(password) {
  return argon2.hash(password, sails.config.custom.argon2Options);
}
module.exports.createHashedPassword = createHashedPassword;

const PASSWORD_MIN_LENGTH = 12;
const SPECIAL_CHARACTERS = '!@#$%^&*()_+\\-=\\[\\]{}|;:\'",.<>?/~`';
const SPECIAL_CHAR_REGEX = new RegExp(`[${SPECIAL_CHARACTERS}]`);

/**
 * Validate a plaintext password against the strength policy.
 *
 * Requirements:
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 *
 * @param {String} password - The plaintext password to validate
 * @returns {{ valid: boolean, message?: string }} Validation result
 */
function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Your password must contain at least one uppercase letter.',
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Your password must contain at least one lowercase letter.',
    };
  }
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Your password must contain at least one digit.',
    };
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return {
      valid: false,
      message:
        'Your password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`).',
    };
  }
  return { valid: true };
}
module.exports.validatePassword = validatePassword;

/**
 * Verify a plaintext password against an argon2 hash.
 * @param {String} hashedPassword - The stored argon2 hash
 * @param {String} plainPassword - The plaintext password to verify
 * @returns {Promise<boolean>} true if the password matches
 */
async function verifyPassword(hashedPassword, plainPassword) {
  return argon2.verify(hashedPassword, plainPassword);
}
module.exports.verifyPassword = verifyPassword;

const authenticateResult = {
  SUCCESS: 'SUCCESS',
  MISMATCH: 'MISMATCH',
  MUST_RESET: 'MUST_RESET',
  NOT_VERIFIED: 'NOT_VERIFIED',
  BANNED: 'BANNED',
};
module.exports.authenticateResult = authenticateResult;

/**
 * Authenticate a caver on GC3
 * @param {String} email
 * @param {String} password
 */
async function authenticate(email, password) {
  const delay = sails.config.custom.authBruteForceDelay;
  if (delay > 0) {
    await setTimeoutP(delay);
  }

  if (!email || !password) return { status: authenticateResult.MISMATCH };

  const user = await TCaver.findOne({ mail: email.toLowerCase() }).populate(
    'groups'
  );

  if (!user) return { status: authenticateResult.MISMATCH };

  if (!user.password?.startsWith('$argon2'))
    return { status: authenticateResult.MUST_RESET, user };

  const isHashMatch = await verifyPassword(user.password, password);
  if (!isHashMatch) return { status: authenticateResult.MISMATCH };

  if (user.banned) return { status: authenticateResult.BANNED, user };

  if (!user.activated) return { status: authenticateResult.NOT_VERIFIED, user };

  return { status: authenticateResult.SUCCESS, user };
}
module.exports.authenticate = authenticate;

/**
 * Generate a cryptographically random activation code
 * @returns {String}
 */
function generateActivationCode() {
  return crypto.randomBytes(32).toString('hex');
}
module.exports.generateActivationCode = generateActivationCode;

/**
 * Send a verification email to a user
 * @param {Object} user
 * @param {String} token
 * @param {String} [locale] - ISO 639-1 locale code (e.g. "fr", "en")
 */
async function sendVerificationEmail(user, token, locale) {
  const verifyLink = `${sails.config.custom.baseUrl}/ui/verify-email?token=${token}`;

  try {
    await sails.helpers.sendEmail.with({
      allowResponse: false,
      emailSubject: 'Verify your email address',
      locale,
      recipientEmail: user.mail,
      viewName: 'verifyEmail',
      viewValues: {
        recipientName: user.nickname,
        verifyLink,
      },
    });
  } catch (err) {
    sails.log.error(
      `Failed to send verification email for user ${user.nickname} (${user.mail}):`,
      err
    );
    throw err;
  }
}
module.exports.sendVerificationEmail = sendVerificationEmail;
