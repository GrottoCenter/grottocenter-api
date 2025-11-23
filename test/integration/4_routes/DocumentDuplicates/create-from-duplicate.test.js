const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document Duplicate features', () => {
  let moderatorToken;
  let userToken;
  let testDocumentId;
  const createdDocIds = [];

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    const doc = await TDocument.create({ author: 1, type: 1, license: 1 });
    testDocumentId = doc.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocumentId });
    await Promise.all(createdDocIds.map((id) => TDocument.destroy({ id })));
  });

  describe('Create from duplicate', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/from-duplicate/1')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return bad request when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/from-duplicate/999999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find duplicate');
          return done();
        });
    });

    it('should create document from duplicate', async () => {
      const duplicate = await TDocumentDuplicate.create({
        author: 1,
        document: testDocumentId,
        content: {
          document: { author: 1, type: 1, license: 1 },
          description: { author: 1, title: 'Test Doc', language: 'eng' },
        },
        dateInscription: new Date(),
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/documents/from-duplicate/${duplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      // Track created document for cleanup
      const [createdDoc] = await TDocument.find().sort('id DESC').limit(1);
      if (createdDoc) createdDocIds.push(createdDoc.id);

      const deletedDup = await TDocumentDuplicate.findOne({ id: duplicate.id });
      should(deletedDup).be.undefined();
    });
  });
});
