const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance unlink document features', () => {
  let moderatorToken;
  let userToken;
  let testEntranceId;
  let testDocumentId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    const entrance = await TEntrance.create({
      latitude: 0,
      longitude: 0,
    }).fetch();
    testEntranceId = entrance.id;
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
    }).fetch();
    testDocumentId = doc.id;
  });

  after(async () => {
    await JDocumentEntrance.destroy({ document: testDocumentId });
    await TEntrance.destroy({ id: testEntranceId });
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('DELETE /api/v1/entrances/:entranceId/documents/:documentId', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
        )
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/987654321/documents/${testDocumentId}`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on deleted entrance', async () => {
      const deletedEntrance = await TEntrance.create({
        isDeleted: true,
        latitude: 0,
        longitude: 0,
      }).fetch();
      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${deletedEntrance.id}/documents/${testDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(404);
      await TEntrance.destroyOne(deletedEntrance.id);
    });

    it('should return 404 on non-existing document', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntranceId}/documents/987654321`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 204 and unlink document from entrance', async () => {
      await TEntrance.addToCollection(
        testEntranceId,
        'documents',
        testDocumentId
      );

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(204);
    });

    it('should verify entrance no longer has the document', async () => {
      await TEntrance.addToCollection(
        testEntranceId,
        'documents',
        testDocumentId
      );

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(204);

      const entrance =
        await TEntrance.findOne(testEntranceId).populate('documents');
      const hasDocument = entrance.documents.some(
        (d) => d.id === testDocumentId
      );
      hasDocument.should.equal(false);
    });

    it('should only unlink from specified entrance when document is linked to multiple', async () => {
      const entrance2 = await TEntrance.create({
        latitude: 1,
        longitude: 1,
      }).fetch();

      await TEntrance.addToCollection(
        testEntranceId,
        'documents',
        testDocumentId
      );
      await TEntrance.addToCollection(
        entrance2.id,
        'documents',
        testDocumentId
      );

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
        )
        .set('Authorization', moderatorToken)
        .expect(204);

      const entrance1 =
        await TEntrance.findOne(testEntranceId).populate('documents');
      const entrance2Updated = await TEntrance.findOne(entrance2.id).populate(
        'documents'
      );

      entrance1.documents.should.have.length(0);
      entrance2Updated.documents.should.have.length(1);
      entrance2Updated.documents[0].id.should.equal(testDocumentId);

      await TEntrance.destroy({ id: entrance2.id });
    });
  });
});
