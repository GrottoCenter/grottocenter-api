let sails = require('sails');
let supertest = require('supertest');

const getAuthToken = async (email) => {
  const res = await supertest(sails.hooks.http.app)
    .post('/api/v1/login')
    .send({ email: email, password: 'testtest' })
    .set('Content-type', 'application/json')
    .set('Accept', 'application/json');
  return 'Bearer ' + res.body.token;
};

module.exports = {
  getAdminAuthToken: async () => {
    return getAuthToken('admin1@admin1.com');
  },
  getModeratorAuthToken: async () => {
    return getAuthToken('moderator1@moderator1.com');
  },
  getUserAuthToken: async () => {
    return getAuthToken('user1@user1.com');
  },
  getAllGroupsAuthToken: async () => {
    return getAuthToken('all1@all1.com');
  },
};
