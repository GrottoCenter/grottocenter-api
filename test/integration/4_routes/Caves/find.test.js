const supertest = require('supertest');
const should = require('should');
const CAVE_PROPERTIES = require('./CAVE_PROPERTIES');

describe('Cave features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: cave } = res;
          should(cave).have.properties(CAVE_PROPERTIES);
          should(cave.name).not.be.empty();
          should(cave.names).not.be.empty();
          should(cave.author).not.be.empty();
          cave.entrances.forEach((entrance) => {
            should(entrance.name).not.be.empty();
          });
          return done();
        });
    });
  });
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const {
            body: { caves },
          } = res;
          caves.forEach((cave) => {
            should(cave).have.properties(CAVE_PROPERTIES);
            should(cave.name).not.be.empty();
            should(cave.names).not.be.empty();
            should(cave.author).not.be.empty();
          });
          return done();
        });
    });
  });
});
