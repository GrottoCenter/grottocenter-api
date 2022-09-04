const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Country features', () => {
  let leaderToken;
  before(async () => {
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
  });
  describe('subscribe and unsubscribe', () => {
    it('should return 404 on inexsisting country subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/123456789/subscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 204 on country subscription', (done) => {
      const countryId = 'FR';
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/subscribe`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Leader has id = 7
          const updatedCaver = await TCaver.findOne(7).populate(
            'subscribedToCountries'
          );
          should(updatedCaver.subscribedToCountries).containDeep([
            { id: countryId },
          ]);
          return done();
        });
    });
  });
});
