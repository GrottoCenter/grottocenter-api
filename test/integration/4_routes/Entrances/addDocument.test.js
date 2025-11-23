const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance add document features', () => {
  let userToken;
  let testEntranceId;
  let testDocumentId;

  before(async () => {
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
    await TEntrance.destroy({ id: testEntranceId });
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('PUT /api/v1/entrances/:entranceId/documents/:documentId', () => {
    describe('Invalid parameters', () => {
      it('should return 404 on non-existing entrance', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/987654321/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(404, done);
      });

      it('should return 404 on deleted entrance', async () => {
        const deletedEntrance = await TEntrance.create({
          isDeleted: true,
          latitude: 0,
          longitude: 0,
        }).fetch();
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${deletedEntrance.id}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(404);
        await TEntrance.destroyOne(deletedEntrance.id);
      });

      it('should return 404 on non-existing document', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${testEntranceId}/documents/987654321`)
          .set('Authorization', userToken)
          .expect(404, done);
      });

      it('should return 404 on deleted document', async () => {
        const deletedDoc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isDeleted: true,
        }).fetch();
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${testEntranceId}/documents/${deletedDoc.id}`)
          .set('Authorization', userToken)
          .expect(404);
        await TDocument.destroyOne(deletedDoc.id);
      });
    });

    describe('Successful add document', () => {
      it('should return 204 and set entrance on document', async () => {
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(204);

        const doc = await TDocument.findOne(testDocumentId);
        should(doc.entrance).equal(testEntranceId);
      });
    });
  });
});
