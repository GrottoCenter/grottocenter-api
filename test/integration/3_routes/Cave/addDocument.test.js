const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Cave features', () => {
  let userToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Add document', () => {
    const existingCaveId = 1;
    const existingDocumentId = 1;
    describe('Invalid parameters', () => {
      it('should return code 404 on inexisting cave', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${987654321}/documents/${existingDocumentId}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
      it('should return code 404 on inexisting document', (done) => {
        supertest(sails.hooks.http.app)
          .put(`/api/v1/caves/${existingCaveId}/documents/${123456789}`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });
    describe('Successfull addDocument', () => {
      after(async () => {
        // Remove added document
        await TCave.removeFromCollection(existingCaveId, 'documents').members([
          existingDocumentId,
        ]);
        const existingCave = await TCave.findOne(existingCaveId).populate(
          'documents'
        );
        should(existingCave.documents.length).be.equal(0);
      });

      it('should return code 204', (done) => {
        supertest(sails.hooks.http.app)
          .put(
            `/api/v1/caves/${existingCaveId}/documents/${existingDocumentId}`
          )
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204, done);
      });
    });
  });
});
