const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const DOCUMENT_PROPERTIES = require('./DOCUMENT_PROPERTIES.js');

describe('Document features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Find by caver id', () => {
    it('should return a list of user documents', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/1/documents')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { documents } = res.body;
          should(documents.length).equals(3);
          for (document of documents) {
            should(document).have.properties(DOCUMENT_PROPERTIES);
          }
          return done();
        });
    });
    it('should return a partial list documents', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/1/documents?limit=2')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206)
        .end((err, res) => {
          if (err) return done(err);
          const { documents } = res.body;
          should(documents.length).equals(2);
          for (document of documents) {
            should(document).have.properties(DOCUMENT_PROPERTIES);
          }
          return done();
        });
    });
    it('should return a sorted list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/1/documents?sortBy=id&orderBy=DESC')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { documents } = res.body;
          should(documents.length).equals(3);
          const ids = [];
          for (document of documents) {
            should(document).have.properties(DOCUMENT_PROPERTIES);
            ids.push(document.id);
            sails.log.info(ids);
          }
          should(ids[0] > ids[1] && ids[1] < ids[2]).be.true;
          return done();
        });
    });
    it('should return an empty list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/4/documents')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { documents } = res.body;
          should(documents.length).equals(0);
          return done();
        });
    });
  });
});
