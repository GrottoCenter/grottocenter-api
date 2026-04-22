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

  const isHashMatch = await argon2.verify(user.password, password);
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
 * @param {Object} i18n
 */
async function sendVerificationEmail(user, token, i18n) {
  const verifyLink = `${sails.config.custom.baseUrl}/ui/verify-email?token=${token}`;

  try {
    await sails.helpers.sendEmail.with({
      allowResponse: false,
      emailSubject: 'Verify your email address',
      i18n,
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
