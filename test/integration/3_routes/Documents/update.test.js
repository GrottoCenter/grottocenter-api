let supertest = require('supertest');
let should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document features', () => {
  let userToken, moderatorToken;
  before(async () => {
    sails.log.info('Asking for user auth token...');
    userToken = await AuthTokenService.getRawBearerUserToken();
    sails.log.info('Asking for moderator auth token...');
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
        .end((err, res) => {
          if (err) return done(err);
          const document = res.body;
          should(document.isValidated).be.false();
          // After updating, new values are stored in modifiedDocJson
          should(document.modifiedDocJson.description).equals(newDescription);
          should(document.modifiedDocJson.title).equals(newTitle);
          return done();
        });
    });
    it('should modify the document type from 18 (Article) to 17 (Issue)', (done) => {
      const issueTypeId = 17;
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/4')
        .send({
          documentType: {
            id: issueTypeId,
          },
        })
        .set('Authorization', moderatorToken) // Doc is not validated because of previous test updating it: only a moderator can edit it
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const document = res.body;
          should(document.isValidated).be.false();
          // After updating, new values are stored in modifiedDocJson
          should(document.modifiedDocJson.type).equals(issueTypeId);
          return done();
        });
    });
  });
});
