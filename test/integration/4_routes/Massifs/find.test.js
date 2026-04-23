const supertest = require('supertest');
const should = require('should');
const fc = require('fast-check');
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
  'geogPolygon',
  'name',
  'isSensitive',
  'author',
  'reviewer',
];

describe('Massif features', () => {
  describe('find', () => {
    it('should return code 404 for non-existent massif', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for massif ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for negative massif ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/-1')
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

  /**
   * GET response includes all expected domain fields and excludes entrances.
   * Encodes: the massif endpoint returns a curated shape, not the raw model.
   * Covers: all fixture massif IDs.
   */
  describe('Property: Massif GET response shape excludes entrances and includes all other fields', () => {
    const EXPECTED_FIELDS = [
      'id',
      'name',
      'descriptions',
      'documents',
      'networks',
      'geogPolygon',
      'isSensitive',
      'author',
      'reviewer',
    ];

    // eslint-disable-next-line func-names
    it('should contain expected fields and not contain entrances for any fixture massif', async function () {
      this.timeout(60000);
      const massifIds = [1];

      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...massifIds), async (massifId) => {
          const res = await supertest(sails.hooks.http.app)
            .get(`/api/v1/massifs/${massifId}`)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200);

          const massif = res.body;

          EXPECTED_FIELDS.forEach((field) => {
            should(massif).have.property(field);
          });

          should(massif).not.have.property('entrances');
        }),
        { numRuns: 100 }
      );
    });
  });
});
