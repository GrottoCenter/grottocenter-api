const supertest = require('supertest');
const should = require('should');

const ORGANIZATION_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'address',
  'authoredCount',
  'authoredDocuments',
  'publishedCount',
  'publishedDocuments',
  'city',
  'country',
  'county',
  'county',
  'customMessage',
  'exploredEntrances',
  'exploredNetworks',
  'isOfficialPartner',
  'latitude',
  'longitude',
  'name',
  'partnerEntrances',
  'partnerNetworks',
  'pictureFileName',
  'postalCode',
  'region',
  'url',
  'yearBirth',
  'managedCountries',
  'managedRegions',
  'managedMassifs',
];

describe('Organization features', () => {
  describe('Find', () => {
    it('should return code 404 for non-existent organization', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for organization ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for negative organization ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/-1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: organization } = res;
          should(organization).have.properties(ORGANIZATION_PROPERTIES);
          should(organization.name).not.be.empty();
          should(organization.dateInscription).not.be.empty();
          return done();
        });
    });

    it('should expose authored and published documents as separate lists', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: organization } = res;
          should(organization.authoredDocuments).be.an.Array();
          should(organization.publishedDocuments).be.an.Array();
          should(organization.authoredCount).be.a.Number();
          should(organization.publishedCount).be.a.Number();
          // Replaced by the two lists above.
          should(organization).not.have.property('documents');
          return done();
        });
    });
  });

  describe('Count', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.have.property('count');
          res.body.count.should.be.a.Number();
          res.body.count.should.be.greaterThanOrEqual(3);
          return done();
        });
    });
  });
});
