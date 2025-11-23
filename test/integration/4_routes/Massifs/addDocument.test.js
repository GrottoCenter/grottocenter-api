const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif add document features', () => {
  let userToken;
  let testMassifId;
  let testDocumentId;

  before(async () => {
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

  describe('PUT /api/v1/massifs/:massifId/documents/:documentId', () => {
    describe('Invalid parameters', () => {
      it('should return 404 on non-existing massif', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/massifs/987654321/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(404, done);
      });

      it('should return 404 on deleted massif', async () => {
        const deletedMassif = await TMassif.create({ isDeleted: true }).fetch();
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/massifs/${deletedMassif.id}/documents/${testDocumentId}`
          )
          .set('Authorization', userToken)
          .expect(404);
        await TMassif.destroyOne(deletedMassif.id);
      });

      it('should return 404 on non-existing document', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/massifs/${testMassifId}/documents/987654321`)
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
          .put(`/api/v1/massifs/${testMassifId}/documents/${deletedDoc.id}`)
          .set('Authorization', userToken)
          .expect(404);
        await TDocument.destroyOne(deletedDoc.id);
      });
    });

    describe('Successful add document', () => {
      it('should return 204 and add massif to document', async () => {
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/massifs/${testMassifId}/documents/${testDocumentId}`)
          .set('Authorization', userToken)
          .expect(204);

        const doc = await TDocument.findOne(testDocumentId).populate('massifs');
        const massifIds = doc.massifs.map((m) => m.id);
        should(massifIds).containEql(testMassifId);
      });
    });
  });
});
