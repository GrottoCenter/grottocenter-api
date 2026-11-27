const supertest = require('supertest');
const sinon = require('sinon');

describe('BibliographicMetadata search', () => {
  describe('POST /api/v1/bibliographic-metadata/search', () => {
    it('should return 200 with empty body', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/bibliographic-metadata/search')
        .send({})
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then((res) => {
          res.body.should.have.property('data').which.is.an.Array();
          res.body.data.should.have.length(0);
          res.body.should.have.property('total', 0);
          done();
        })
        .catch(done);
    });

    it('should return 200 with search results and total', async () => {
      const stub = sinon
        .stub(sails.services.bibliographicmetadataservice, 'searchMetadata')
        .resolves({ rows: [{ id: 1, title: 'Test' }], total: 1 });

      try {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/bibliographic-metadata/search')
          .send({ query: 'test' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        res.body.data.should.deepEqual([{ id: 1, title: 'Test' }]);
        res.body.total.should.equal(1);
      } finally {
        stub.restore();
      }
    });

    it('should return 400 with a diagnostic on an unsupported field', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/bibliographic-metadata/search')
        .send({ and: [{ title: 'Document' }, { publication_year: 1990 }] })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
      res.body.should.have.property('error', 'UNSUPPORTED_SEARCH_FIELD');
      res.body.should.have.property('field', 'publication_year');
    });

    it('should return a total larger than data.length when truncated', async () => {
      const original = sails.config.custom.biblioSearchMaxRows;
      sails.config.custom.biblioSearchMaxRows = 1;
      try {
        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/bibliographic-metadata/search')
          .send({ title: 'Document' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
        res.body.data.should.have.length(1);
        res.body.total.should.be.greaterThan(res.body.data.length);
      } finally {
        sails.config.custom.biblioSearchMaxRows = original;
      }
    });
  });
});
