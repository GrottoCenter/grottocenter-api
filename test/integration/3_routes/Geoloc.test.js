const supertest = require('supertest');
const should = require('should');

describe('Geoloc features', () => {
  describe('count entrances', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          /* eslint-disable camelcase */
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
          /* eslint-enable camelcase */
        })
        .expect(400, done);
    });
    it('should return code 400 on out-of-range parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          /* eslint-disable camelcase */
          sw_lat: 0,
          sw_lng: -250,
          ne_lat: 100,
          ne_lng: 0,
          /* eslint-enable camelcase */
        })
        .expect(400, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          /* eslint-disable camelcase */
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
          /* eslint-enable camelcase */
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { count } = res.body;
          should(count).equal(2); // 3rd entrance is out of bounds, so the result is 2.
          return done();
        });
    });
    it('should return code 200 and count = 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          /* eslint-disable camelcase */
          sw_lat: -80,
          sw_lng: -170,
          ne_lat: -79,
          ne_lng: -169,
          /* eslint-enable camelcase */
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { count } = res.body;
          should(count).equal(0);
          return done();
        });
    });
  });
});
