const supertest = require('supertest');
const should = require('should');

describe('Entrances snapshots features', () => {
  describe('get-snapshots()', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/-1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200 and a list of completed entrances (network)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/snapshots?isNetwork=true')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrances } = res;
          should(entrances).not.be.empty();
          should(entrances.entrances[0]).not.be.null();
          should(entrances.entrances[0].latitude).not.be.null();
          should(entrances.entrances[0].longitude).not.be.null();
          should(entrances.entrances[0].cave).equal(3);
          should(entrances.entrances[0].caveName).not.be.null();
          return done();
        });
    });
    it('should return code 200 and a list of completed entrances and related cave', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/3/snapshots?isNetwork=false')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrances } = res;
          should(entrances).not.be.empty();
          should(entrances.entrances[0]).not.be.null();
          should(entrances.entrances[0].latitude).not.be.null();
          should(entrances.entrances[0].longitude).not.be.null();
          should(entrances.entrances[0].cave).not.be.null();
          should(entrances.entrances[0].cave.id).equal(6);
          return done();
        });
    });
    it('should return code 200 and a list of completed entrances without latitude and longitude', (done) => {
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
