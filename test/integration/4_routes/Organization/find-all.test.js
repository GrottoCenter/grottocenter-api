const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization find-all', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('GET /api/v1/organizations', () => {
    it('should return 200 with organizations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('organizations');
          should(res.body.organizations).be.an.Array();
          return done();
        });
    });

    it('should include deleted organizations for moderators', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
