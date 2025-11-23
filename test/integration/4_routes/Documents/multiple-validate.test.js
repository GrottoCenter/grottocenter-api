const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document multiple-validate', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Multiple validate', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 when refusing without comment', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: 1, isValidated: 'false' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should validate empty list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204, done);
    });

    it('should validate a single document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
    });

    it('should validate multiple documents', async () => {
      const doc1 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      const doc2 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            { id: doc1.id, isValidated: 'true' },
            { id: doc2.id, isValidated: 'true' },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated1 = await TDocument.findOne(doc1.id);
      const updated2 = await TDocument.findOne(doc2.id);
      should(updated1.isValidated).be.true();
      should(updated2.isValidated).be.true();
    });

    it('should reject a document with comment', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            {
              id: doc.id,
              isValidated: 'false',
              validationComment: 'Rejected for testing',
            },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.validationComment).equal('Rejected for testing');
    });

    it('should validate document with modifiedDocJson', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Original',
        body: 'Original body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 17 },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.modifiedDocJson).be.null();
    });
  });
});
