const argon2 = require('argon2');
const util = require('util');

const setTimeoutP = util.promisify(setTimeout);

/**
 * GC3 hashing password algorithm (argon2id)
 * @param {String} password
 */
async function createHashedPassword(password) {
  return argon2.hash(password);
}
module.exports.createHashedPassword = createHashedPassword;

const authenticateResult = {
  SUCCESS: 'SUCCESS',
  MISMATCH: 'MISMATCH',
  MUST_RESET: 'MUST_RESET',
};
module.exports.authenticateResult = authenticateResult;

/**
 * Authenticate a caver on GC3
 * @param {String} email
 * @param {String} password
 */
async function authenticate(email, password) {
  await setTimeoutP(500); // Basic brute force prevention

  if (!email || !password) return { status: authenticateResult.MISMATCH };

  const user = await TCaver.findOne({ mail: email.toLowerCase() }).populate(
    'groups'
  );

  if (!user) return { status: authenticateResult.MISMATCH };
  if (!user.password?.startsWith('$argon2'))
    return { status: authenticateResult.MUST_RESET };

  const isHashMatch = await argon2.verify(user.password, password);
  if (!isHashMatch) return { status: authenticateResult.MISMATCH };

  return { status: authenticateResult.SUCCESS, user };
}
module.exports.authenticate = authenticate;
