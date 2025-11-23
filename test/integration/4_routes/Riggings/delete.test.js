const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Rigging features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/riggings/1')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when rigging does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/riggings/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should soft delete a rigging', async () => {
      const rig = await TRigging.create({
        author: 1,
        title: 'Test',
        entrance: 999,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/riggings/${rig.id}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should permanently delete a rigging', async () => {
      const rig = await TRigging.create({
        author: 1,
        title: 'Test',
        entrance: 999,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/riggings/${rig.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const deleted = await TRigging.findOne(rig.id);
      should(deleted).be.undefined();
    });
  });
});
