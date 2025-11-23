const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Location features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/locations/1')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when location does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/locations/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should soft delete a location', async () => {
      const loc = await TLocation.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/locations/${loc.id}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should permanently delete a location', async () => {
      const loc = await TLocation.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/locations/${loc.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const deleted = await TLocation.findOne(loc.id);
      should(deleted).be.undefined();
    });
  });
});
