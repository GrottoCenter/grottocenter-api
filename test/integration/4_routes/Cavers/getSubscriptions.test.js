const supertest = require('supertest');
const should = require('should');

describe('Caver features', () => {
  describe('get subscriptions', () => {
    it('should return 404 on invalid caver id', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/123456789/subscriptions`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/cavers/${1}/subscriptions`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          const {
            subscriptions: { countries, massifs },
          } = res.body;
          should(countries).have.length(2);
          should(massifs).have.length(2);
          for (const country of countries) {
            should(country).have.properties(['id', 'iso3']);
            should(country.id).not.be.undefined();
            should(country.iso3).not.be.undefined();
          }
          for (const massif of massifs) {
            should(massif).have.properties(['id', 'names']);
            should(massif.id).not.be.undefined();
            should(massif.names).not.be.empty();
          }
          return done();
        });
    });
  });
});
