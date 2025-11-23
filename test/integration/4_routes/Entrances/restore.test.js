const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/entrances/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted entrance', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted entrance', async () => {
      const entrance = await TEntrance.create({
        isDeleted: true,
        latitude: 0,
        longitude: 0,
        author: 1,
        reviewer: 1,
      }).fetch();
      await TName.create({
        entrance: entrance.id,
        name: 'Test Entrance',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/entrances/${entrance.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TEntrance.findOne(entrance.id);
      restored.isDeleted.should.be.false();

      await TName.destroy({ entrance: entrance.id });
      await TEntrance.destroyOne(entrance.id);
    });
  });
});
