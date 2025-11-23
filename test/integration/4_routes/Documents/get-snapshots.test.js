const supertest = require('supertest');

describe('Document get-snapshots', () => {
  describe('GET /api/v1/documents/:id/snapshots', () => {
    it('should return 404 for document with no snapshots', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${doc.id}/snapshots`)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
