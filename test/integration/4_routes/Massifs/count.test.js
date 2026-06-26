const supertest = require('supertest');
const should = require('should');

describe('Massif count features', () => {
  describe('GET /api/v1/massifs/count', () => {
    it('should return code 200 with count of non-deleted massifs', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/count')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('count');
          should(res.body.count).be.a.Number();
          should(res.body.count).be.greaterThanOrEqual(0);
          return done();
        });
    });
  });
});
