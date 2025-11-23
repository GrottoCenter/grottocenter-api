const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Bibliographic Metadata features', () => {
  let userToken;
  let testDocumentId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const doc = await TDocument.findOne({ id: 1 });
    testDocumentId = doc.id;
  });

  describe('Get record format', () => {
    it('should return bad request when id is missing', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/bibliographic-metadata//format/marc21')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end(done);
    });

    it('should return bad request when format is missing', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/bibliographic-metadata/${testDocumentId}/format/`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end(done);
    });

    it('should return not found for non-existent document', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/bibliographic-metadata/999999/format/marc21')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not found');
          return done();
        });
    });

    it('should get record in marc21 format', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/bibliographic-metadata/${testDocumentId}/format/marc21`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('metadata');
          should(res.body).have.property('format', 'marc21');
          return done();
        });
    });

    it('should get record with country format', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/bibliographic-metadata/${testDocumentId}/format/marc21-FR`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('metadata');
          should(res.body).have.property('format', 'marc21');
          should(res.body).have.property('country');
          return done();
        });
    });

    it('should handle multiple document IDs', async () => {
      const doc2 = await TDocument.findOne({ id: 2 });
      if (!doc2) return;

      await supertest(sails.hooks.http.app)
        .get(
          `/api/v1/bibliographic-metadata/${testDocumentId},${doc2.id}/format/marc21`
        )
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .then((res) => {
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          should(res.body[0]).have.property('metadata');
          should(res.body[0]).have.property('format', 'marc21');
        });
    });
  });
});
