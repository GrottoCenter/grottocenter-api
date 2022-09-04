const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif features', () => {
  let leaderToken;
  before(async () => {
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
  });
  describe('subscribe', () => {
    it('should return 404 on inexsisting massif subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/123456789/subscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 204 on massif subscription', (done) => {
      const massifId = 1;
      supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massifId}/subscribe`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Leader has id = 7
          const updatedCaver = await TCaver.findOne(7).populate(
            'subscribedToMassifs'
          );
          should(updatedCaver.subscribedToMassifs).containDeep([
            { id: massifId },
          ]);
          return done();
        });
    });
  });
});
