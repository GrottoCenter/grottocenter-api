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

    it('should return 200, mark massif as sensitive, cascade to non-touristic entrances, skip touristic entrances, and return correct counts', async () => {
      sinon.stub(EntranceService, 'updateInSearch').resolves();
      sinon.stub(MassifService, 'updateInSearch').resolves();

      let massifId;
      let caveId;
      let ent1Id;
      let ent2Id;

      try {
        const massif = await TMassif.create({
          author: 1,
          dateInscription: new Date(),
          isSensitive: false,
          geogPolygon: 'SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        }).fetch();
        massifId = massif.id;

        await TName.create({
          massif: massifId,
          name: 'Test Sensitive Massif Mark',
          language: 'eng',
          isMain: true,
          author: 1,
        });

        const cave = await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        caveId = cave.id;

        // Ent 1: non-touristic, unsensitive (should be affected)
        const ent1 = await EntranceService.createEntrance(
          { token: { id: 1 } },
          {
            author: 1,
            latitude: 0.5,
            longitude: 0.5,
            cave: caveId,
            isSensitive: false,
            isTouristic: false,
          },
          { name: { author: 1, text: 'Ent 1', language: 'eng' } }
        );
        ent1Id = ent1.id;

        // Ent 2: touristic, unsensitive (should be skipped)
        const ent2 = await EntranceService.createEntrance(
          { token: { id: 1 } },
          {
            author: 1,
            latitude: 0.6,
            longitude: 0.6,
            cave: caveId,
            isSensitive: false,
            isTouristic: true,
          },
          { name: { author: 1, text: 'Ent 2', language: 'eng' } }
        );
        ent2Id = ent2.id;

        // Manually set point_geom for both
        await CommonService.query(
          'UPDATE t_entrance SET point_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE id IN ($1, $2)',
          [ent1Id, ent2Id]
        );

        const res = await supertest(sails.hooks.http.app)
          .post(`/api/v1/massifs/${massifId}/mark-sensitive`)
          .set('Authorization', adminToken)
          .expect(200);

        res.body.sensitiveMarked.should.equal(1);
        res.body.touristicSkipped.should.equal(1);
        res.body.massif.isSensitive.should.be.true();

        const modifiedMassif = await TMassif.findOne(massifId);
        modifiedMassif.isSensitive.should.be.true();

        const modifiedEnt1 = await TEntrance.findOne(ent1Id);
        modifiedEnt1.isSensitive.should.be.true();

        const modifiedEnt2 = await TEntrance.findOne(ent2Id);
        modifiedEnt2.isSensitive.should.be.false();
      } finally {
        if (ent1Id) {
          await TName.destroy({ entrance: ent1Id }).catch(() => {});
          await TEntrance.destroyOne(ent1Id).catch(() => {});
        }
        if (ent2Id) {
          await TName.destroy({ entrance: ent2Id }).catch(() => {});
          await TEntrance.destroyOne(ent2Id).catch(() => {});
        }
        if (caveId) await TCave.destroyOne(caveId).catch(() => {});
        if (massifId) {
          await TName.destroy({ massif: massifId }).catch(() => {});
          await TMassif.destroyOne(massifId).catch(() => {});
        }
      }
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

      response.body.sensitiveMarked.should.equal(0);
      response.body.touristicSkipped.should.equal(0);
      response.body.massif.isSensitive.should.be.true();

      // Cleanup
      await TName.destroy({ massif: massif.id });
      await TMassif.destroyOne(massif.id);
    });
  });
});
