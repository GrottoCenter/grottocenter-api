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

  describe('Delete many', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrance-duplicates')
        .query({ id: [1, 2] })
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return bad request when id is missing', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrance-duplicates')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('must provide the id');
          return done();
        });
    });

    it('should delete multiple entrance duplicates', async () => {
      const dup1 = await TEntranceDuplicate.create({
        author: 1,
        entrance: testEntranceId,
        content: {},
        dateInscription: new Date(),
      });
      const dup2 = await TEntranceDuplicate.create({
        author: 1,
        entrance: testEntranceId,
        content: {},
        dateInscription: new Date(),
      });

      await supertest(sails.hooks.http.app)
        .delete('/api/v1/entrance-duplicates')
        .query({ id: [dup1.id, dup2.id] })
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const found1 = await TEntranceDuplicate.findOne({ id: dup1.id });
      const found2 = await TEntranceDuplicate.findOne({ id: dup2.id });
      should(found1).be.undefined();
      should(found2).be.undefined();
    });
  });
});
