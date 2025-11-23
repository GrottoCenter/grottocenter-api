const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document find', () => {
  let userToken;
  let moderatorToken;
  let testDocId;
  let testDocWithModifiedJsonId;
  let testDescId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();

    const doc = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: true,
    }).fetch();
    testDocId = doc.id;

    const desc = await TDescription.create({
      author: 1,
      title: 'Original',
      body: 'Original body',
    }).fetch();
    testDescId = desc.id;

    const docWithModifiedJson = await TDocument.create({
      author: 1,
      type: 1,
      license: 1,
      isValidated: false,
      descriptions: [desc.id],
      modifiedDocJson: {
        reviewerId: 2,
        documentData: { type: 17 },
        descriptionData: { title: 'Modified', body: 'Modified body' },
      },
    }).fetch();
    testDocWithModifiedJsonId = docWithModifiedJson.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocId });
    await TDocument.destroy({ id: testDocWithModifiedJsonId });
    await TDescription.destroy({ id: testDescId });
  });

  describe('Find', () => {
    it('should return 404 when document does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/999999')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return a document', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${testDocId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          should(res.body).have.property('type');
          return done();
        });
    });

    it('should return modified document data when requireUpdate is true', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/documents/${testDocWithModifiedJsonId}?requireUpdate=true`
        )
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id');
          return done();
        });
    });

    it('should return base document when requireUpdate is false', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/documents/${testDocId}?requireUpdate=false`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDocId);
          return done();
        });
    });

    it('should return deleted document with limited info for non-moderator', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isDeleted: true,
      }).fetch();

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${doc.id}`)
          .set('Authorization', userToken)
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body).have.property('id', doc.id);
            should(res.body).have.property('isDeleted', true);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
      }
    });

    it('should return full deleted document for moderator', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isDeleted: true,
      }).fetch();

      try {
        await supertest(sails.hooks.http.app)
          .get(`/api/v1/documents/${doc.id}`)
          .set('Authorization', moderatorToken)
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body).have.property('id', doc.id);
            should(res.body).have.property('isDeleted', true);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
      }
    });
  });
});
