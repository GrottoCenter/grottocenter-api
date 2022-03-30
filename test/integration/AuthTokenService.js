const sails = require('sails');
const supertest = require('supertest');
const TokenService = require('../../api/services/TokenService');

const getRawAuthToken = async (email) => {
  const res = await supertest(sails.hooks.http.app)
    .post('/api/v1/login')
    .send({ email, password: 'testtest' })
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
  getRawBearerAdminToken: async () => `Bearer ${await getRawAuthToken('admin1@admin1.com')}`,
  getRawBearerModeratorToken: async () => `Bearer ${await getRawAuthToken('moderator1@moderator1.com')}`,
  getRawBearerUserToken: async () => `Bearer ${await getRawAuthToken('user1@user1.com')}`,
  getRawBearerAllGroupsToken: async () => `Bearer ${await getRawAuthToken('all1@all1.com')}`,

  // Custom Grottocenter token to put in req object
  getAdminToken: async () => getToken('admin1@admin1.com'),
  getModeratorToken: async () => getToken('moderator1@moderator1.com'),
  getUserToken: async () => getToken('user1@user1.com'),
  getAllGroupsToken: async () => getToken('all1@all1.com'),
};
