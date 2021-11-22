let supertest = require('supertest');
let should = require('should');

const CAVE_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'author',
  'dateInscription',
  'dateReviewed',
  'depth',
  'descriptions',
  'documents',
  'entrances',
  'isDeleted',
  'isDiving',
  'length',
  'name',
  'names',
  'temperature',
];

describe('Cave features', () => {
  describe('find()', () => {
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
          return done();
        });
    });
  });
  describe('findAll()', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: caves } = res;
          sails.log.info(caves);
          caves.forEach((cave) => {
            sails.log.debug(cave);
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
