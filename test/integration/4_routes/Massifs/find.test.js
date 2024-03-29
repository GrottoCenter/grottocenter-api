const supertest = require('supertest');
const should = require('should');
const massifPolygon = require('./FAKE_DATA');

const MASSIF_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'dateInscription',
  'dateReviewed',
  'descriptions',
  'documents',
  'entrances',
  'geogPolygon',
  'name',
  'author',
  'reviewer',
];

describe('Massif features', () => {
  describe('find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: massif } = res;
          should(massif).have.properties(MASSIF_PROPERTIES);
          should(massif.geogPolygon).equal(massifPolygon.geoJson1ToString);
          should(massif.name).not.be.empty();
          return done();
        });
    });
  });
});
