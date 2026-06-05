const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');
const EntranceService = require('../../../../api/services/EntranceService');

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

    it('should return 200 and correct non-zero counts for admin when there are affected entrances', async () => {
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
          name: 'Preview Test Massif',
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
          .get(`/api/v1/massifs/${massifId}/preview-sensitive`)
          .set('Authorization', adminToken)
          .expect(200);

        should(res.body).have.property('sensitiveMarked', 1);
        should(res.body).have.property('touristicSkipped', 1);
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
  });
});
