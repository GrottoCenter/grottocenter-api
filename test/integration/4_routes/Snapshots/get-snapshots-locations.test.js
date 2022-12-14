const supertest = require('supertest');
const should = require('should');

describe('Locations snapshots features', () => {
  describe('get-snapshots()', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/locations/-1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200 and a list of completed locations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/locations/1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: locations } = res;
          should(locations).not.be.empty();
          should(locations.locations[0].author).not.be.null();
          should(locations.locations[0].entrance).not.be.null();
          return done();
        });
    });
    it('should return code 403', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/locations/2/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });
  });
});
