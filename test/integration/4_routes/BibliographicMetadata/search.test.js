const supertest = require('supertest');
const sinon = require('sinon');
const BibliographicMetadataService = require('../../../../api/services/BibliographicMetadataService');

describe('BibliographicMetadata search', () => {
  describe('POST /api/v1/bibliographic-metadata/search', () => {
    it('should return 200 with empty body', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/bibliographic-metadata/search')
        .send({})
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should return 200 with search results', async () => {
      const stub = sinon
        .stub(BibliographicMetadataService, 'searchMetadata')
        .resolves([{ id: 1, title: 'Test' }]);

      await supertest(sails.hooks.http.app)
        .post('/api/v1/bibliographic-metadata/search')
        .send({ query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      stub.restore();
    });
  });
});
