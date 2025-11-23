const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document Duplicate features', () => {
  let moderatorToken;
  let userToken;
  let testDocumentId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    const doc = await TDocument.create({ author: 1, type: 1, license: 1 });
    testDocumentId = doc.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('Delete many', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/document-duplicates')
        .query({ id: [1, 2] })
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
        .delete('/api/v1/document-duplicates')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('must provide the id');
          return done();
        });
    });

    it('should delete multiple document duplicates', async () => {
      const dup1 = await TDocumentDuplicate.create({
        author: 1,
        document: testDocumentId,
        content: {},
        dateInscription: new Date(),
      });
      const dup2 = await TDocumentDuplicate.create({
        author: 1,
        document: testDocumentId,
        content: {},
        dateInscription: new Date(),
      });

      await supertest(sails.hooks.http.app)
        .delete('/api/v1/document-duplicates')
        .query({ id: [dup1.id, dup2.id] })
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const found1 = await TDocumentDuplicate.findOne({ id: dup1.id });
      const found2 = await TDocumentDuplicate.findOne({ id: dup2.id });
      should(found1).be.undefined();
      should(found2).be.undefined();
    });
  });
});
