const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('History features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('create', () => {
    it('should return 400', (done) => {
      const newHistory = {
        body: 'new body',
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/histories')
        .send(newHistory)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 200', (done) => {
      const newHistory = {
        body: 'new body',
        entrance: 1,
        language: 'fra',
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/histories')
        .send(newHistory)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const historyUpdated = res.body;
          should(historyUpdated.body).equals(newHistory.body);
          return done();
        });
    });
  });
});
