const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document validate', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Single validate', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/1/validate')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 when refusing without comment', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/1/validate?isValidated=false')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should validate a document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${doc.id}/validate`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.dateValidation).not.be.null();
    });

    it('should reject a document with comment', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(
          `/api/v1/documents/${doc.id}/validate?isValidated=false&validationComment=Test rejection`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.false();
      should(updated.validationComment).equal('Test rejection');
    });
  });
});
