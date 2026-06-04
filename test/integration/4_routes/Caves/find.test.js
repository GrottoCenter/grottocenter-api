const supertest = require('supertest');
const should = require('should');
const CAVE_PROPERTIES = require('./CAVE_PROPERTIES');
const CAVE_PROPERTIES_SHORT = require('./CAVE_PROPERTIES_SHORT');

describe('Cave features', () => {
  describe('find', () => {
    it('should return code 404 for non-existent cave', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for cave ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for negative cave ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/-1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for invalid cave ID format', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/abc')
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
          should(cave.guidelines).have.property('massif');
          should(cave.guidelines.massif).be.an.Array();
          cave.entrances.forEach((entrance) => {
            should(entrance.name).not.be.empty();
          });
          return done();
        });
    });

    it('should return empty guidelines array when cave has no massifs', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/2')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: cave } = res;
          should(cave.guidelines).deepEqual([]);
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
            should(cave).have.properties(CAVE_PROPERTIES_SHORT);
            should(cave).not.be.empty();
          });
          return done();
        });
    });
  });
});
