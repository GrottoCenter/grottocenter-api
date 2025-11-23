const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document update-with-new-entities', () => {
  let userToken;
  let testDocId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    testDocId = doc.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocId });
  });

  describe('Update with new entities', () => {
    it('should return 404 when document does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/999999/new-entities')
        .send({
          document: { title: 'Test' },
          newAuthors: [],
          newDescriptions: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 when document is deleted', async () => {
      const deletedDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isDeleted: true,
      }).fetch();
      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${deletedDoc.id}/new-entities`)
        .send({
          document: { title: 'Test' },
          newAuthors: [],
          newDescriptions: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should update document without new entities', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}/new-entities`)
        .send({
          document: { authors: [1], descriptions: [] },
          newAuthors: [],
          newDescriptions: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          return done();
        });
    });

    it('should update document with new authors', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}/new-entities`)
        .send({
          document: { authors: [1], descriptions: [] },
          newAuthors: [{ name: 'New Author', surname: 'Test' }],
          newDescriptions: [],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          const doc = await TDocument.findOne(testDocId).populate('authors');
          should(doc.authors.length).be.greaterThan(1);
          return done();
        });
    });

    it('should update document with new descriptions', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}/new-entities`)
        .send({
          document: { authors: [1], descriptions: [] },
          newAuthors: [],
          newDescriptions: [
            {
              title: 'New Desc',
              body: 'Test body',
              language: 'eng',
              author: 1,
            },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          const doc =
            await TDocument.findOne(testDocId).populate('descriptions');
          should(doc.descriptions.length).be.greaterThan(0);
          return done();
        });
    });

    it('should update document with both new authors and descriptions', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}/new-entities`)
        .send({
          document: { authors: [1], descriptions: [] },
          newAuthors: [
            {
              name: 'Another',
              surname: 'Author',
              mail: `test-${Date.now()}@example.com`,
            },
          ],
          newDescriptions: [
            {
              title: 'Another Desc',
              body: 'Another body',
              language: 'fra',
              author: 1,
            },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          return done();
        });
    });
  });
});
