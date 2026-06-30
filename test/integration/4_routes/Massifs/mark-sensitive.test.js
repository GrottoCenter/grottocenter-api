const supertest = require('supertest');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const EntranceService = require('../../../../api/services/EntranceService');
const MassifService = require('../../../../api/services/MassifService');
const CommonService = require('../../../../api/services/CommonService');

describe('Massif mark-sensitive route features', () => {
  let adminToken;
  let userToken;
  let moderatorToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('POST /api/v1/massifs/:id/mark-sensitive', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return 403 for user', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/mark-sensitive')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 403 for moderator (non-admin)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/mark-sensitive')
        .set('Authorization', moderatorToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/987654321/mark-sensitive')
        .set('Authorization', adminToken)
        .expect(404, done);
    });

    it('should return 200 and mark massif as sensitive for admin', async () => {
      sinon.stub(EntranceService, 'updateInSearch').resolves();
      sinon.stub(MassifService, 'updateInSearch').resolves();

      const massif = await TMassif.create({
        isSensitive: false,
        author: 1,
      }).fetch();
      await TName.create({
        massif: massif.id,
        name: 'Test Sensitive Massif Mark',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/mark-sensitive`)
        .set('Authorization', adminToken)
        .expect(200);

      const modified = await TMassif.findOne(massif.id);
      modified.isSensitive.should.be.true();

      await TName.destroy({ massif: massif.id });
      await TMassif.destroyOne(massif.id);
    });

    it('should be idempotent: return 200 and count: 0 when marking an already sensitive massif', async () => {
      sinon.stub(MassifService, 'updateInSearch').resolves();

      const massif = await TMassif.create({
        isSensitive: true,
        author: 1,
      }).fetch();
      await TName.create({
        massif: massif.id,
        name: 'Already Sensitive Massif',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      const response = await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/mark-sensitive`)
        .set('Authorization', adminToken)
        .expect(200);

      response.body.count.should.equal(0);
      response.body.massif.isSensitive.should.be.true();

      // Cleanup
      await TName.destroy({ massif: massif.id });
      await TMassif.destroyOne(massif.id);
    });

    it('should return 403 when the massif sensitivity is locked', async () => {
      const massif = await TMassif.create({
        isSensitive: false,
        isSensitiveLocked: true,
        author: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/mark-sensitive`)
        .set('Authorization', adminToken)
        .expect(403);

      // The massif must remain non-sensitive
      const modified = await TMassif.findOne(massif.id);
      modified.isSensitive.should.be.false();

      await TMassif.destroyOne(massif.id);
    });

    it('should skip locked entrances during the cascade and report skippedLockedCount', async () => {
      sinon.stub(EntranceService, 'updateInSearch').resolves();
      sinon.stub(MassifService, 'updateInSearch').resolves();

      const massif = await TMassif.create({
        isSensitive: false,
        author: 1,
        geogPolygon: 'SRID=4326;POLYGON((20 20, 21 20, 21 21, 20 21, 20 20))',
      }).fetch();
      const cave = await TCave.create({ author: 1 }).fetch();

      // One unlocked + one locked non-sensitive entrance within the polygon
      const unlocked = await TEntrance.create({
        author: 1,
        latitude: 20.5,
        longitude: 20.5,
        cave: cave.id,
        isSensitive: false,
        isSensitiveLocked: false,
      }).fetch();
      const locked = await TEntrance.create({
        author: 1,
        latitude: 20.6,
        longitude: 20.6,
        cave: cave.id,
        isSensitive: false,
        isSensitiveLocked: true,
      }).fetch();
      await CommonService.query(
        'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id = ANY($1)',
        [[unlocked.id, locked.id]]
      );

      const response = await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/mark-sensitive`)
        .set('Authorization', adminToken)
        .expect(200);

      response.body.count.should.equal(1);
      response.body.skippedLockedCount.should.equal(1);

      const updatedUnlocked = await TEntrance.findOne(unlocked.id);
      updatedUnlocked.isSensitive.should.be.true();
      const updatedLocked = await TEntrance.findOne(locked.id);
      updatedLocked.isSensitive.should.be.false();

      // Cleanup
      await TEntrance.destroy({ id: [unlocked.id, locked.id] });
      await TCave.destroyOne(cave.id);
      await TMassif.destroyOne(massif.id);
    });
  });
});
