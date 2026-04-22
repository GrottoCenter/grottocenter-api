const supertest = require('supertest');
const should = require('should');
const massifPolygon = require('./FAKE_DATA');
const AuthTokenService = require('../../AuthTokenService');

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
  'author',
  'reviewer',
];

describe('Massif features', () => {
  let adminToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

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
          should(massif).not.have.property('isSensitive');
          should(massif.geogPolygon).equal(massifPolygon.geoJson1ToString);
          should(massif.name).not.be.empty();
          return done();
        });
    });
    it('should return isSensitive for admin', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('isSensitive');
          return done();
        });
    });
  });

  describe('GET response shape excludes entrances and includes domain fields', () => {
    const EXPECTED_FIELDS = [
      'id',
      'name',
      'descriptions',
      'documents',
      'networks',
      'geogPolygon',
      'author',
      'reviewer',
    ];

    it('should contain expected fields and not contain entrances for massif 1', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const massif = res.body;

          EXPECTED_FIELDS.forEach((field) => {
            should(massif).have.property(field);
          });

          // isSensitive is only returned for admins
          should(massif).not.have.property('isSensitive');
          should(massif).not.have.property('entrances');
          return done();
        });
    });
  });
});
