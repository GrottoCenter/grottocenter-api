const supertest = require('supertest');
const should = require('should');

const COUNTRY_PROPERTIES = ['id', 'nativeName'];

describe('Country features', () => {
  describe('Find', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/abcdefgh')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: organization } = res;
          should(organization).have.properties(COUNTRY_PROPERTIES);
          should(organization.id).not.be.empty();
          should(organization.nativeName).not.be.empty();
          return done();
        });
    });
  });
});
