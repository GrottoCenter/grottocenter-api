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
    await JDocumentEntrance.destroy({ document: testDocumentId });
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

    describe('Duplicate document-entrance relationship', () => {
      afterEach(async () => {
        await JDocumentEntrance.destroy({ document: testDocumentId });
      });

      it('should return 400 when adding same document twice to same entrance', async () => {
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(204);

        const response = await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(400);

        should(response.body.message).match(/already linked to entrance/);
      });
    });

    describe('Successful add document', () => {
      afterEach(async () => {
        await JDocumentEntrance.destroy({ document: testDocumentId });
      });

      it('should return 204 and link document to entrance', async () => {
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(204);

        const links = await JDocumentEntrance.find({
          document: testDocumentId,
          entrance: testEntranceId,
        });
        should(links).have.length(1);
      });

      it('should allow linking document to multiple entrances', async () => {
        const entrance2 = await TEntrance.create({
          latitude: 1,
          longitude: 1,
        }).fetch();

        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(204);

        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entrance2.id}/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(204);

        const doc =
          await TDocument.findOne(testDocumentId).populate('entrances');
        should(doc.entrances).have.length(2);
        const entranceIds = doc.entrances.map((e) => e.id).sort();
        should(entranceIds).deepEqual([testEntranceId, entrance2.id].sort());

        await TEntrance.destroy({ id: entrance2.id });
      });

      it('should allow document to be linked to 3+ entrances', async () => {
        const entrance2 = await TEntrance.create({
          latitude: 1,
          longitude: 1,
        }).fetch();
        const entrance3 = await TEntrance.create({
          latitude: 2,
          longitude: 2,
        }).fetch();
        const entrance4 = await TEntrance.create({
          latitude: 3,
          longitude: 3,
        }).fetch();

        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/entrances/${testEntranceId}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(204);

        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entrance2.id}/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(204);

        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entrance3.id}/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(204);

        await supertest(sails.hooks.http.app)
          .put(`/api/v1/entrances/${entrance4.id}/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(204);

        const doc =
          await TDocument.findOne(testDocumentId).populate('entrances');
        should(doc.entrances).have.length(4);

        await TEntrance.destroy({
          id: [entrance2.id, entrance3.id, entrance4.id],
        });
      });
    });
  });
});
