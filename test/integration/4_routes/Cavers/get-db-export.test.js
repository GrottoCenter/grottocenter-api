const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver get-db-export', () => {
  let userToken;
  let leaderToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
  });

  describe('GET /api/v1/cavers/export/db', () => {
    it('should return 403 for non-leader', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/export/db')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/export/db')
        .set('Accept', 'application/json')
        .expect(401);
    });

    it('should return export info for leader', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/export/db')
        .set('Authorization', leaderToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('url');
    });
  });
});
