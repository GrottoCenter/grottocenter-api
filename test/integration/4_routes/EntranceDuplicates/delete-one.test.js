const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance Duplicate features', () => {
  let moderatorToken;
  let userToken;
  let testEntranceId;
  let testDuplicateId;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    testEntranceId = 1;

    const duplicate = await TEntranceDuplicate.create({
      author: 1,
      entrance: testEntranceId,
      content: { test: 'data' },
      dateInscription: new Date(),
    });
    testDuplicateId = duplicate.id;
  });

  describe('Delete one', () => {
    it('should forbid non-moderator users', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrance-duplicates/${testDuplicateId}`)
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
        .delete('/api/v1/entrance-duplicates/')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end(done);
    });

    it('should return bad request when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/entrance-duplicates/999999')
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find duplicate');
          return done();
        });
    });

    it('should delete duplicate successfully', async () => {
      const newDuplicate = await TEntranceDuplicate.create({
        author: 1,
        entrance: testEntranceId,
        content: { test: 'data2' },
        dateInscription: new Date(),
      });

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrance-duplicates/${newDuplicate.id}`)
        .set('Authorization', moderatorToken)
        .set('Accept', 'application/json')
        .expect(204);

      const deleted = await TEntranceDuplicate.findOne({ id: newDuplicate.id });
      should(deleted).be.undefined();
    });
  });
});
