const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance touristic-sensitive-report route features', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('GET /api/v1/entrances/touristic-sensitive-report', () => {
    it('should return 403 Forbidden for a regular user', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/touristic-sensitive-report')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 401 Unauthorized when no token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/touristic-sensitive-report')
        .expect(401, done);
    });

    it('should return 200 and list conflicting entrances for admin', async () => {
      let caveId;
      let entrance1Id;
      let entrance2Id;

      try {
        // Create cave
        const cave = await TCave.create({
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        caveId = cave.id;

        // Create entrance 1 (conflicting: both sensitive and touristic)
        const entrance1 = await TEntrance.create({
          author: 1,
          latitude: 45.0,
          longitude: 5.0,
          cave: caveId,
          isSensitive: true,
          isTouristic: true,
          dateInscription: new Date(),
        }).fetch();
        entrance1Id = entrance1.id;

        await TName.create({
          author: 1,
          dateInscription: new Date(),
          entrance: entrance1Id,
          isMain: true,
          language: 'eng',
          name: 'Conflicting Entrance 1',
        });

        // Create entrance 2 (not conflicting: sensitive but not touristic)
        const entrance2 = await TEntrance.create({
          author: 1,
          latitude: 45.0,
          longitude: 5.0,
          cave: caveId,
          isSensitive: true,
          isTouristic: false,
          dateInscription: new Date(),
        }).fetch();
        entrance2Id = entrance2.id;

        await TName.create({
          author: 1,
          dateInscription: new Date(),
          entrance: entrance2Id,
          isMain: true,
          language: 'eng',
          name: 'Sensitive Entrance 2',
        });

        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/entrances/touristic-sensitive-report')
          .set('Authorization', adminToken)
          .expect(200);

        should(res.body).have.property('count');
        should(res.body).have.property('entrances');

        const ids = res.body.entrances.map((e) => e.id);
        ids.should.containEql(entrance1Id);
        ids.should.not.containEql(entrance2Id);

        const record = res.body.entrances.find((e) => e.id === entrance1Id);
        should(record).have.property('name', 'Conflicting Entrance 1');
        should(record).have.property('isSensitive', true);
        should(record).have.property('isTouristic', true);
      } finally {
        if (entrance1Id) {
          await TName.destroy({ entrance: entrance1Id });
          await TEntrance.destroyOne(entrance1Id);
        }
        if (entrance2Id) {
          await TName.destroy({ entrance: entrance2Id });
          await TEntrance.destroyOne(entrance2Id);
        }
        if (caveId) {
          await TCave.destroyOne(caveId);
        }
      }
    });
  });
});
