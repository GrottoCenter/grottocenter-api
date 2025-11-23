const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Document restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/documents/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing document', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted document', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted document', async () => {
      const doc = await TDocument.create({
        isDeleted: true,
        author: 1,
        reviewer: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/documents/${doc.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TDocument.findOne(doc.id);
      restored.isDeleted.should.be.false();

      await TDocument.destroyOne(doc.id);
    });
  });
});
