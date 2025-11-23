const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrances/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when entrance does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrances/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should soft delete an entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should soft delete with redirectTo', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}?entityId=1`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      should(res.body.redirectTo).equal(1);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should handle already deleted entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should permanently delete an entrance', async () => {
      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TEntrance.findOne(entrance.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete and merge into another entrance', async () => {
      const targetEntrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
      }).fetch();

      const entrance = await TEntrance.create({
        author: 1,
        latitude: '0',
        longitude: '0',
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/entrances/${entrance.id}?isPermanent=true&entityId=${targetEntrance.id}`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TEntrance.findOne(entrance.id);
      should(deleted).be.undefined();

      // Clean up target entrance
      await TEntrance.destroy({ id: targetEntrance.id });
    });
  });
});
