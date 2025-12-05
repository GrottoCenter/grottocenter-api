const supertest = require('supertest');
const should = require('should');

describe('Entrance snapshots fix for undefined token', () => {
  describe('get-snapshots() without authentication', () => {
    it('should handle undefined token gracefully and return 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrances } = res;
          should(entrances).not.be.empty();
          should(entrances.entrances).be.an.Array();
          return done();
        });
    });

    it('should handle undefined token for sensitive entrance and hide coordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/2/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrances } = res;
          should(entrances).not.be.empty();
          should(entrances.entrances[0]).not.be.null();
          should(entrances.entrances[0].latitude).be.null();
          should(entrances.entrances[0].longitude).be.null();
          return done();
        });
    });
  });
});
