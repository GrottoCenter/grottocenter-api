const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Country features', () => {
  let leaderToken;
  let adminToken;
  let userToken;
  const countryId = 'FR';
  before(async () => {
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
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

    it('should return 404 on trying to unsubscribe from an inexsisting country', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/123456789/unsubscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 400 on trying to unsubscribe from an inexisting subscription', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/countries/GB/unsubscribe')
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 403 when non-leader/non-admin tries to unsubscribe', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/unsubscribe`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 403 when leader tries to unsubscribe another user', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/unsubscribe?userId=1`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 204 on country unsubscription', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/unsubscribe`)
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
          should(updatedCaver.subscribedToCountries).have.length(0);
          return done();
        });
    });

    it('should allow admin to unsubscribe another user', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/countries/${countryId}/subscribe`)
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          return supertest(sails.hooks.http.app)
            .post(`/api/v1/countries/${countryId}/unsubscribe?userId=7`)
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(204)
            .end(async (err2) => {
              if (err2) return done(err2);

              const updatedCaver = await TCaver.findOne(7).populate(
                'subscribedToCountries'
              );
              should(updatedCaver.subscribedToCountries).have.length(0);
              return done();
            });
        });
    });
  });
});
