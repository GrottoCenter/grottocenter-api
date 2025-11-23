const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Description features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/descriptions/1')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when description does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/descriptions/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should soft delete a description', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Test',
        entrance: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/descriptions/${desc.id}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.true();

      // Clean up
      await TDescription.destroy({ id: desc.id });
    });

    it('should permanently delete a description', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Test',
        entrance: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/descriptions/${desc.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const deleted = await TDescription.findOne(desc.id);
      should(deleted).be.undefined();
    });
  });
});
