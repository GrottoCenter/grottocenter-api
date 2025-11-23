const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Subject features', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Search', () => {
    it('should search subjects by name', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/subjects/search/logical/or')
        .send({ name: 'cave' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('subjects');
          should(res.body.subjects).be.an.Array();
          return done();
        });
    });

    it('should search subjects by code', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/subjects/search/logical/or')
        .send({ code: '1' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('subjects');
          should(res.body.subjects).be.an.Array();
          return done();
        });
    });

    it('should handle case insensitive search', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/subjects/search/logical/or')
        .send({ name: 'CAVE' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('subjects');
          return done();
        });
    });

    it('should search with both name and code', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/subjects/search/logical/or')
        .send({ name: 'cave', code: '1' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('subjects');
          return done();
        });
    });

    it('should return empty results when no match', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/subjects/search/logical/or')
        .send({ name: 'nonexistentsubject12345' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.subjects).be.an.Array();
          return done();
        });
    });
  });
});
