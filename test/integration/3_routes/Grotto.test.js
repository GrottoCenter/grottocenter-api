let supertest = require('supertest');
let should = require('should');

describe('Grotto features', () => {
  describe('find()', () => {
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
          should(organization).have.properties([
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
            'exploredCaves',
            'isOfficialPartner',
            'latitude',
            'longitude',
            'name',
            'partneredCaves',
            'pictureFileName',
            'postalCode',
            'region',
            'url',
            'village',
            'yearBirth',
          ]);
          should(organization.name).not.be.empty();
          should(organization.names).not.be.empty();
          should(organization.dateInscription).not.be.empty();
          return done();
        });
    });
  });
});