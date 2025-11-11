const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Region features', () => {
  let leaderToken;
  const countryId = 'FR';
  const regionId = '01';
  before(async () => {
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
  });
  describe('subscribe and unsubscribe', () => {
    it('should return 404 on inexisting country subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/INVALID/regions/01/subscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 on inexisting region subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/FR/regions/INVALID/subscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 204 on region subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/regions/${regionId}/subscribe`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Leader has id = 7
          const updatedCaver = await TCaver.findOne(7).populate(
            'subscribedToRegions'
          );
          should(updatedCaver.subscribedToRegions).containDeep([
            { id: `${countryId}-${regionId}` },
          ]);
          return done();
        });
    });

    it('should return 404 on trying to unsubscribe from an inexisting country', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/INVALID/regions/01/unsubscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 on trying to unsubscribe from an inexisting region', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/FR/regions/INVALID/unsubscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 204 on region unsubscription', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/regions/${regionId}/unsubscribe`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Leader has id = 7
          const updatedCaver = await TCaver.findOne(7).populate(
            'subscribedToRegions'
          );
          should(updatedCaver.subscribedToRegions).have.length(0);
          return done();
        });
    });
  });
});
