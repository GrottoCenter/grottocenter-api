const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');

describe('Massif preview-sensitive route features', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('GET /api/v1/massifs/:id/preview-sensitive', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return 403 for user', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1/preview-sensitive')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/987654321/preview-sensitive')
        .set('Authorization', adminToken)
        .expect(404, done);
    });

    it('should return 200 and a count for admin', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/100/preview-sensitive')
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          should(res.body).have.property('count', 0);
          should(res.body).have.property('lockedCount', 0);
        })
        .end(done);
    });

    it('should report lockedCount and exclude locked entrances from count', async () => {
      const massif = await TMassif.create({
        isSensitive: false,
        author: 1,
        geogPolygon: 'SRID=4326;POLYGON((30 30, 31 30, 31 31, 30 31, 30 30))',
      }).fetch();
      const cave = await TCave.create({ author: 1 }).fetch();

      const unlocked = await TEntrance.create({
        author: 1,
        latitude: 30.4,
        longitude: 30.4,
        cave: cave.id,
        isSensitive: false,
        isSensitiveLocked: false,
      }).fetch();
      const locked = await TEntrance.create({
        author: 1,
        latitude: 30.6,
        longitude: 30.6,
        cave: cave.id,
        isSensitive: false,
        isSensitiveLocked: true,
      }).fetch();
      await CommonService.query(
        'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = ANY($1)',
        [[unlocked.id, locked.id]]
      );

      await supertest(sails.hooks.http.app)
        .get(`/api/v1/massifs/${massif.id}/preview-sensitive`)
        .set('Authorization', adminToken)
        .expect(200)
        .expect((res) => {
          should(res.body).have.property('count', 1);
          should(res.body).have.property('lockedCount', 1);
        });

      // Cleanup
      await TEntrance.destroy({ id: [unlocked.id, locked.id] });
      await TCave.destroyOne(cave.id);
      await TMassif.destroyOne(massif.id);
    });
  });
});
