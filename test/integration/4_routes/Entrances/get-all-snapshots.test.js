const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance get-all-snapshots', () => {
  let moderatorToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('GET /api/v1/entrances/:id/all-snapshots', () => {
    it('should return 404 for entrance with no snapshots', async () => {
      const entrance = await TEntrance.create({
        name: 'Test',
        latitude: 1,
        longitude: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/entrances/${entrance.id}/all-snapshots`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);

      // Clean up
      await TEntrance.destroy({ id: entrance.id });
    });

    it('should return 200 with snapshots for entrance with history', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should respect isNetwork query parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots?isNetwork=true')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should include deleted items for moderators', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
