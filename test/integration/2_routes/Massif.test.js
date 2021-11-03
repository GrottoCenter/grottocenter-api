let supertest = require('supertest');
let should = require('should');

describe('Massif features', () => {
  describe('find()', () => {
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
          should(massif).have.properties([
            '@context',
            '@id',
            '@type',
            'id',
            'caves',
            'dateInscription',
            'dateReviewed',
            'descriptions',
            'name',
            'names',
            'reviewer',
          ]);
          should(massif.name).not.be.empty();
          should(massif.names).not.be.empty();
          return done();
        });
    });
  });
});
