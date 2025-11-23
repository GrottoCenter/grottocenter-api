const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('EntranceDuplicate find-all', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('GET /api/v1/entrance-duplicates', () => {
    it('should return 206 with duplicates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('duplicates');
          should(res.body.duplicates).be.an.Array();
          return done();
        });
    });

    it('should respect skip parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates?skip=1')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206);
    });

    it('should respect limit parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates?limit=5')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206);
    });
  });
});
