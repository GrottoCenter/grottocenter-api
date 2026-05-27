const sails = require('sails');
const supertest = require('supertest');
const { authenticator } = require('otplib');
const TokenService = require('../../api/services/TokenService');
const MfaService = require('../../api/services/MfaService');
const RightService = require('../../api/services/RightService');

const TEST_PASSWORD = 'testtest';
const DEV_SECRET = 'JBSWY3DPEHPK3PXP';

/**
 * Ensures MFA is set up for an admin caver so login can succeed with a TOTP code.
 * Non-admin emails are returned as-is.
 */
const ensureMfaSetup = async (email) => {
  const caver = await TCaver.findOne({ mail: email }).populate('groups');
  if (
    !caver ||
    !RightService.hasGroup(caver.groups, RightService.G.ADMINISTRATOR)
  ) {
    return;
  }
  if (!caver.mfaEnabled) {
    const encryptedSecret = MfaService.encryptSecret(DEV_SECRET);
    await TCaver.updateOne({ id: caver.id }).set({
      mfaEnabled: true,
      totpSecret: encryptedSecret,
      lastUsedTotp: null,
      lastUsedTotpAt: null,
    });
  }
};

const getRawAuthToken = async (email) => {
  await ensureMfaSetup(email);

  const caver = await TCaver.findOne({ mail: email }).populate('groups');
  const isAdmin =
    caver && RightService.hasGroup(caver.groups, RightService.G.ADMINISTRATOR);

  const payload = { email, password: TEST_PASSWORD };
  if (isAdmin) {
    // Clear lastUsedTotp to avoid replay rejection when multiple tests
    // request admin tokens within the same 30-second TOTP window
    await TCaver.updateOne({ id: caver.id }).set({
      lastUsedTotp: null,
      lastUsedTotpAt: null,
    });
    payload.totpCode = authenticator.generate(DEV_SECRET);
  }

  const res = await supertest(sails.hooks.http.app)
    .post('/api/v1/login')
    .send(payload)
    .set('Content-type', 'application/json')
    .set('Accept', 'application/json');
  return res.body.token;
};

const getToken = async (email) => {
  const token = await getRawAuthToken(email);
  return TokenService.verify(token, (err, responseToken) => {
    if (err) {
      throw err;
    }
    return responseToken;
  });
};

module.exports = {
  // Raw Bearer token for HTTP request
  getRawBearerAdminToken: async () =>
    `Bearer ${await getRawAuthToken('admin1@admin1.com')}`,
  getRawBearerModeratorToken: async () =>
    `Bearer ${await getRawAuthToken('moderator1@moderator1.com')}`,
  getRawBearerUserToken: async () =>
    `Bearer ${await getRawAuthToken('user1@user1.com')}`,
  getRawBearerLeaderToken: async () =>
    `Bearer ${await getRawAuthToken('leader1@leader1.com')}`,
  getRawBearerAllGroupsToken: async () =>
    `Bearer ${await getRawAuthToken('all1@all1.com')}`,

  // Custom Grottocenter token to put in req object
  getAdminToken: async () => getToken('admin1@admin1.com'),
  getModeratorToken: async () => getToken('moderator1@moderator1.com'),
  getUserToken: async () => getToken('user1@user1.com'),
  getLeaderToken: async () => getToken('leader1@leader1.com'),
  getAllGroupsToken: async () => getToken('all1@all1.com'),

  TEST_PASSWORD,
};
