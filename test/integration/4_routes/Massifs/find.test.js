const supertest = require('supertest');
const should = require('should');
const massifPolygon = require('./FAKE_DATA');

// Fields visible to any user (no auth required)
const MASSIF_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'dateInscription',
  'dateReviewed',
  'descriptions',
  'documents',
  'geogPolygon',
  'name',
  'isSensitive',
  'author',
  'reviewer',
  'networks',
];

describe('Massif features', () => {
  describe('GET /api/v1/massifs/:id', () => {
    [987654321, 0, -1].forEach((id) => {
      it(`should return code 404 for invalid or non-existent ID: ${id}`, (done) => {
        supertest(sails.hooks.http.app)
          .get(`/api/v1/massifs/${id}`)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    it('should return 200 and the expected massif shape for a valid ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: massif } = res;

          should(massif).have.properties(MASSIF_PROPERTIES);
          should(massif).not.have.property('entrances');
          should(massif.geogPolygon).equal(massifPolygon.geoJson1ToString);
          should(massif.name).not.be.empty();

          return done();
        });
    });
  });
});
