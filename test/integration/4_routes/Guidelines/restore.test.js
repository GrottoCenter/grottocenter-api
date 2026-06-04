const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline restore', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('restore', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when guideline does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/999999/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 400 when guideline is not deleted', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/guidelines/1/restore')
        .set('Authorization', moderatorToken)
        .expect(400, done);
    });

    it('should successfully restore a soft-deleted guideline', async () => {
      const guideline = await TGuideline.create({
        title: 'Restore Me',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
        isDeleted: true,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .post(`/api/v1/guidelines/${guideline.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.false();

      const updated = await TGuideline.findOne(guideline.id);
      should(updated.isDeleted).be.false();
    });
  });
});
