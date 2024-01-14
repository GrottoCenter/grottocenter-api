const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Update', () => {
    it('should modify the document title and description', (done) => {
      const newDescription = 'A new description for the best equipment.';
      const newTitle = 'Very Best 2021 Equipment';
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/4')
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
          const modifiedDoc = await TDocument.findOne(4);
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
        .put('/api/v1/documents/4')
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
          const modifiedDoc = await TDocument.findOne(4);
          should(modifiedDoc.modifiedDocJson.documentData.type).equals(17);
          return done();
        });
    });
  });
});
