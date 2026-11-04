const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance Duplicate features', () => {
  let moderatorToken;
  let userToken;
  let testEntranceId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    testEntranceId = 1;
  });

  describe('Create from duplicate', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/from-duplicate/1')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return bad request when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/from-duplicate/999999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find duplicate');
          return done();
        });
    });

    it('should create entrance from duplicate', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const duplicate = await TEntranceDuplicate.create({
        author: 1,
        entrance: testEntranceId,
        content: {
          entrance: {
            author: 1,
            latitude: 45.0,
            longitude: 6.0,
            cave: cave.id,
          },
          nameDescLoc: { name: { text: 'Test', language: 'eng', author: 1 } },
        },
        dateInscription: new Date(),
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/entrances/from-duplicate/${duplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const deletedDup = await TEntranceDuplicate.findOne({ id: duplicate.id });
      should(deletedDup).be.undefined();
      await TCave.destroy({ id: cave.id });
    }).timeout(10000);

    it('should stamp the creation date at materialization, not at import', async () => {
      const importDate = '2020-01-15T10:00:00.000Z';
      const cave = await TCave.create({ author: 1 }).fetch();
      const duplicate = await TEntranceDuplicate.create({
        author: 1,
        entrance: testEntranceId,
        content: {
          entrance: {
            author: 1,
            latitude: 45.0,
            longitude: 6.0,
            cave: cave.id,
            dateInscription: importDate,
          },
          nameDescLoc: {
            name: {
              text: 'Stale date name',
              language: 'eng',
              author: 1,
              dateInscription: importDate,
            },
            description: {
              title: 'Stale date description',
              body: 'Body',
              language: 'eng',
              author: 1,
              dateInscription: importDate,
            },
            location: {
              body: 'Location body',
              language: 'eng',
              author: 1,
              dateInscription: importDate,
            },
          },
        },
        dateInscription: new Date(importDate),
      }).fetch();

      const before = Date.now();
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/entrances/from-duplicate/${duplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const [created] = await TEntrance.find({ cave: cave.id })
        .sort('id DESC')
        .limit(1);
      should(created).be.ok();
      should(new Date(created.dateInscription).getTime()).be.aboveOrEqual(
        before - 1000
      );

      const [name] = await TName.find({ entrance: created.id });
      const [description] = await TDescription.find({ entrance: created.id });
      const [location] = await TLocation.find({ entrance: created.id });
      [name, description, location].forEach((row) => {
        should(row).be.ok();
        should(new Date(row.dateInscription).getTime()).be.aboveOrEqual(
          before - 1000
        );
      });

      await TName.destroy({ entrance: created.id });
      await TDescription.destroy({ entrance: created.id });
      await TLocation.destroy({ entrance: created.id });
      await TEntrance.destroy({ id: created.id });
      await TCave.destroy({ id: cave.id });
    }).timeout(10000);
  });
});
