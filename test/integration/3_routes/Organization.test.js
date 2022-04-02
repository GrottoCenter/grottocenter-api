const supertest = require('supertest');
const should = require('should');

const ORGANIZATION_PROPERTIES = [
  '@context',
  '@id',
  '@type',
  'id',
  'address',
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
  'village',
  'yearBirth',
];

describe('Grotto features', () => {
  describe('Find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/987654321')
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
          should(organization.names).not.be.empty();
          should(organization.dateInscription).not.be.empty();
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
          res.body.should.deepEqual({ count: 3 });
          return done();
        });
    });
  });
});
