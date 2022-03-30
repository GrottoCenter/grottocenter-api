const supertest = require('supertest');
const should = require('should');

const LICENSE_PROPERTIES = ['id', 'isCopyrighted', 'name', 'text', 'url'];

describe('License features', () => {
  describe('findAll', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/licenses')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: licenses } = res;
          for (const license of licenses) {
            should(license).have.properties(LICENSE_PROPERTIES);
            should(license.id).not.be.undefined();
            should(license.isCopyrighted).not.be.undefined();
            should(license.name).not.be.empty();
            should(license.url).not.be.empty();
          }
          return done();
        });
    });
  });
});
