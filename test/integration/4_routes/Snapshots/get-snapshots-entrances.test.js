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
          // Find the first regular (non-name-change) snapshot
          const regularSnapshots = entrances.entrances.filter(
            (e) => !e.isNameChangeSnapshot
          );
          should(regularSnapshots.length).be.above(0);
          should(regularSnapshots[0].latitude).not.be.null();
          should(regularSnapshots[0].longitude).not.be.null();
          should(regularSnapshots[0].cave).equal(3);
          should(regularSnapshots[0].caveName).be.a.String().and.not.be.empty();
          should(regularSnapshots[0].caveName).equal('Grotte de la Montagne');
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
    it('should include name-change snapshots in the timeline (network)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/snapshots?isNetwork=true')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrances } = res;
          const nameChangeSnapshots = entrances.entrances.filter(
            (e) => e.isNameChangeSnapshot === true
          );
          // We have 2 h_name records for entrance 1 with is_main=true
          should(nameChangeSnapshots.length).equal(2);
          nameChangeSnapshots.forEach((s) => {
            should(s.isNameChangeSnapshot).equal(true);
            should(s.name).be.a.String().and.not.be.empty();
            should(s.t_id).equal(1);
          });
          return done();
        });
    });
  });

  describe('get-all-snapshots()', () => {
    it('should return temporal caveName and name-change snapshots in entrances array (network)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1/all-snapshots?isNetwork=true')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body } = res;
          should(body.entrances).be.an.Array().and.not.be.empty();
          // Verify caveName is temporally resolved
          const regularSnapshots = body.entrances.filter(
            (e) => !e.isNameChangeSnapshot
          );
          should(regularSnapshots.length).be.above(0);
          regularSnapshots.forEach((s) => {
            should(s.caveName).be.a.String().and.not.be.empty();
          });
          // Verify name-change snapshots are injected
          const nameChangeSnapshots = body.entrances.filter(
            (e) => e.isNameChangeSnapshot === true
          );
          should(nameChangeSnapshots.length).equal(2);
          return done();
        });
    });
  });
});
