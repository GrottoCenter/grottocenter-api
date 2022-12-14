const supertest = require('supertest');
const should = require('should');

describe('Descriptions snapshots features', () => {
  describe('get-snapshots()', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/descriptions/-1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200 and a list of completed descriptions', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/descriptions/1/snapshots')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: descriptions } = res;
          should(descriptions).not.be.empty();
          should(descriptions.descriptions[0]).not.be.null();
          return done();
        });
    });
  });
});
