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
      const cave = await TCave.create({ author: 1 });
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
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/entrances/from-duplicate/${duplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const deletedDup = await TEntranceDuplicate.findOne({ id: duplicate.id });
      should(deletedDup).be.undefined();

      await TCave.destroy({ id: cave.id });
    }).timeout(5000);
  });
});
