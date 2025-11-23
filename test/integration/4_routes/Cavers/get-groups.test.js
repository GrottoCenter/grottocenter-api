const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver get-groups', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('GET /api/v1/cavers/groups', () => {
    it('should return 401 without authentication', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/groups')
        .set('Accept', 'application/json')
        .expect(401);
    });

    it('should return all groups when authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/groups')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('administrators');
          should(res.body).have.property('moderators');
          should(res.body).have.property('leaders');
          should(res.body.administrators).be.an.Array();
          should(res.body.moderators).be.an.Array();
          should(res.body.leaders).be.an.Array();
          return done();
        });
    });
  });
});
