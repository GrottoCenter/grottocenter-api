const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document update', () => {
  let userToken;
  let moderatorToken;
  let testDocId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    const doc = await TDocument.create({
      author: 1,
      type: 18,
      license: 1,
      isValidated: true,
    }).fetch();
    testDocId = doc.id;
  });

  after(async () => {
    await TDocument.destroy({ id: testDocId });
  });

  describe('Update', () => {
    it('should return 404 for non-existent document', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/999999')
        .send({ title: 'Test' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(404);
    });

    it('should return 403 when non-moderator tries to update document with pending modifications', async () => {
      const docWithMod = await TDocument.create({
        author: 1,
        type: 18,
        license: 1,
        isValidated: true,
        modifiedDocJson: { documentData: { title: 'Pending' } },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${docWithMod.id}`)
        .send({ title: 'New Title' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(403);

      await TDocument.destroy({ id: docWithMod.id });
    });
    it('should modify the document title and description', (done) => {
      const newDescription = 'A new description for the best equipment.';
      const newTitle = 'Very Best 2021 Equipment';
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}`)
        .send({
          description: newDescription,
          title: newTitle,
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          const document = res.body;
          should(document.isValidated).be.false();

          // After updating, new values are stored in modifiedDocJson (not exposed in the response body)
          const modifiedDoc = await TDocument.findOne(testDocId);
          should(modifiedDoc.modifiedDocJson.descriptionData.body).equals(
            newDescription
          );
          should(modifiedDoc.modifiedDocJson.descriptionData.title).equals(
            newTitle
          );
          return done();
        });
    });
    it('should modify the document type from 18 (Article) to 17 (Issue)', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}`)
        .send({ type: 'Issue' })
        .set('Authorization', moderatorToken) // Doc is not validated because of previous test updating it: only a moderator can edit it
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end(async (err, res) => {
          if (err) return done(err);
          const document = res.body;
          should(document.isValidated).be.false();
          // After updating, new values are stored in modifiedDocJson (not exposed in the response body)
          const modifiedDoc = await TDocument.findOne(testDocId);
          should(modifiedDoc.modifiedDocJson.documentData.type).equals(17);
          return done();
        });
    });

    it('should handle modifiedFiles and deletedFiles', async () => {
      const res = await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${testDocId}`)
        .send({
          title: 'Updated with files',
          modifiedFiles: [],
          deletedFiles: [],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(200);

      should(res.body).have.property('id');
    });
  });
});
