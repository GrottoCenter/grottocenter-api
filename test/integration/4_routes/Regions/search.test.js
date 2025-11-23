const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Region features', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Search', () => {
    it('should return empty results when no query provided', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.results).be.an.Array().with.length(0);
          should(res.body.totalCount).equal(0);
          should(res.body.totalPages).equal(0);
          return done();
        });
    });

    it('should search regions by name', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({ query: 'FR' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('results');
          should(res.body).have.property('totalCount');
          should(res.body).have.property('totalPages');
          return done();
        });
    });

    it('should apply limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({ query: 'a', limit: 5 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.results.length).be.lessThanOrEqual(5);
          return done();
        });
    });

    it('should cap limit at 100', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({ query: 'a', limit: 200 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.results.length).be.lessThanOrEqual(100);
          return done();
        });
    });

    it('should apply offset parameter', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({ query: 'a', offset: 5 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('results');
          return done();
        });
    });

    it('should sanitize query to prevent SQL injection', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/regions/search/logical/or')
        .send({ query: "FR'; DROP TABLE t_country; --" })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('results');
          return done();
        });
    });
  });
});
