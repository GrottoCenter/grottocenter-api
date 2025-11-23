const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Cave unlink document features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('DELETE /api/v1/caves/:caveId/documents/:documentId', () => {
    const existingCaveId = 1;
    const existingDocumentId = 1;

    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/caves/${existingCaveId}/documents/${existingDocumentId}`
        )
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing cave', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/987654321/documents/${existingDocumentId}`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on deleted cave', async () => {
      const deletedCave = await TCave.create({ isDeleted: true }).fetch();
      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/caves/${deletedCave.id}/documents/${existingDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(404);
      await TCave.destroyOne(deletedCave.id);
    });

    it('should return 404 on non-existing document', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${existingCaveId}/documents/987654321`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 204 and unlink document', async () => {
      await TCave.addToCollection(
        existingCaveId,
        'documents',
        existingDocumentId
      );

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/caves/${existingCaveId}/documents/${existingDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(204);
    });
  });
});
