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
      content: {
        document: { title: 'Test Document' },
        description: { body: 'Test description' },
      },
      dateInscription: new Date(),
    });
    testDuplicateId = duplicate.id;
  });

  after(async () => {
    await TDocumentDuplicate.destroy({ id: testDuplicateId });
    await TDocument.destroy({ id: testDocumentId });
  });

  describe('Find', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/document-duplicates/${testDuplicateId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return 404 when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/document-duplicates/999999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not found');
          return done();
        });
    });

    it('should find duplicate successfully', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/document-duplicates/${testDuplicateId}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const { body: duplicate } = res;
          should(duplicate).have.property('id');
          should(duplicate).have.property('author');
          should(duplicate).have.property('document');
          should(duplicate).have.property('content');
          should(duplicate.id).equal(testDuplicateId);

          return done();
        });
    });

    it('should handle invalid duplicate ID format', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/document-duplicates/invalid')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Invalid duplicate ID format');
          return done();
        });
    });

    it('should handle negative duplicate ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/document-duplicates/-1')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should handle zero duplicate ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/document-duplicates/0')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
