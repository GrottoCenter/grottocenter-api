const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('History features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('update', () => {
    it('should return 404 ', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/histories/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200', (done) => {
      const update = {
        body: 'new body',
        language: 'fra',
      };
      supertest(sails.hooks.http.app)
        .put('/api/v1/histories/3')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const historyUpdated = res.body;
          should(historyUpdated.body).equals(update.body);
          should(historyUpdated.language).equals(update.language);
          should(historyUpdated.author.nickname).equals('Admin1');
          return done();
        });
    });
  });
});
