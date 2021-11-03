let sails = require('sails');
let supertest = require('supertest');

const getRawAuthToken = async (email) => {
  const res = await supertest(sails.hooks.http.app)
    .post('/api/v1/login')
    .send({ email: email, password: 'testtest' })
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
  getRawBearerAdminToken: async () => {
    return 'Bearer ' + (await getRawAuthToken('admin1@admin1.com'));
  },
  getRawBearerModeratorToken: async () => {
    return 'Bearer ' + (await getRawAuthToken('moderator1@moderator1.com'));
  },
  getRawBearerUserToken: async () => {
    return 'Bearer ' + (await getRawAuthToken('user1@user1.com'));
  },
  getRawBearerAllGroupsToken: async () => {
    return 'Bearer ' + (await getRawAuthToken('all1@all1.com'));
  },

  // Custom Grottocenter token to put in req object
  getAdminToken: async () => {
    return getToken('admin1@admin1.com');
  },
  getModeratorToken: async () => {
    return getToken('moderator1@moderator1.com');
  },
  getUserToken: async () => {
    return getToken('user1@user1.com');
  },
  getAllGroupsToken: async () => {
    return getToken('all1@all1.com');
  },
};
