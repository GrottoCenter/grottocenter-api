const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document Duplicate features', () => {
  let moderatorToken;
  let userToken;
  let testDocumentId;
  let testDuplicateId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
    });
    testDocumentId = doc.id;

    const duplicate = await TDocumentDuplicate.create({
      author: 1,
      document: testDocumentId,
      content: { test: 'data' },
      dateInscription: new Date(),
    });
    testDuplicateId = duplicate.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('Delete one', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/document-duplicates/${testDuplicateId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return bad request when id is missing', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/document-duplicates/')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end(done);
    });

    it('should return bad request when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/document-duplicates/999999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find duplicate');
          return done();
        });
    });

    it('should delete duplicate successfully', async () => {
      const newDuplicate = await TDocumentDuplicate.create({
        author: 1,
        document: testDocumentId,
        content: { test: 'data2' },
        dateInscription: new Date(),
      });

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/document-duplicates/${newDuplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const deleted = await TDocumentDuplicate.findOne({ id: newDuplicate.id });
      should(deleted).be.undefined();
    });
  });
});
