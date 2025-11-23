const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Get contributors', () => {
    it('should return 403 when user is not moderator or admin', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/1')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 for invalid page parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/invalid')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 for zero page', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/0')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 for negative page', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/-1')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return contributors for page 1', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/1')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('data');
          should(res.body).have.property('pagination');
          should(res.body.pagination).have.property('page', 1);
          should(res.body.pagination).have.property('limit', 100);
          should(res.body.pagination).have.property('total');
          should(res.body.pagination).have.property('totalPages');
          return done();
        });
    });

    it('should return 404 for page beyond total pages', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/contributors/9999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
