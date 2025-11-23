const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif unlink document features', () => {
  let moderatorToken;
  let userToken;
  let testMassifId;
  let testDocumentId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    const massif = await TMassif.create({}).fetch();
    testMassifId = massif.id;
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
    }).fetch();
    testDocumentId = doc.id;
  });

  after(async () => {
    await TMassif.destroy({ id: testMassifId });
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('DELETE /api/v1/massifs/:massifId/documents/:documentId', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${testMassifId}/documents/${testDocumentId}`)
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/987654321/documents/${testDocumentId}`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on deleted massif', async () => {
      const deletedMassif = await TMassif.create({ isDeleted: true }).fetch();
      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/massifs/${deletedMassif.id}/documents/${testDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(404);
      await TMassif.destroyOne(deletedMassif.id);
    });

    it('should return 404 on non-existing document', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${testMassifId}/documents/987654321`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 204 and unlink document', async () => {
      await TMassif.addToCollection(testMassifId, 'documents', testDocumentId);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${testMassifId}/documents/${testDocumentId}`)
        .set('Authorization', moderatorToken)
        .expect(204);
    });
  });
});
