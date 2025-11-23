const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document find-all', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Find all', () => {
    it('should find all validated documents by default', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
          should([200, 206]).containEql(res.status);
          should(res.body).have.property('documents');
          should(res.body.documents).be.an.Array();
          return done();
        });
    });

    it('should filter by isValidated parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ isValidated: 'false' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should apply skip parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ skip: 5 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (err) return done(err);
          should([200, 206]).containEql(res.status);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should apply limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ limit: 10 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.documents.length).be.lessThanOrEqual(10);
          return done();
        });
    });

    it('should cap limit at 100', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ limit: 200 })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.documents.length).be.lessThanOrEqual(100);
          return done();
        });
    });

    it('should apply sorting parameters', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ sortBy: 'dateInscription', orderBy: 'DESC' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('documents');
          return done();
        });
    });

    it('should filter by document type', async () => {
      const type = await TType.findOne({ name: 'Article' });
      if (!type) return;

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/documents')
        .query({ documentType: 'Article' })
        .set('Authorization', userToken)
        .set('Accept', 'application/json');

      should([200, 206]).containEql(res.status);
      should(res.body).have.property('documents');
    });
  });
});
