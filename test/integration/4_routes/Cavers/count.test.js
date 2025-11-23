const supertest = require('supertest');
const should = require('should');

describe('Caver count features', () => {
  describe('GET /api/v1/cavers/count', () => {
    it('should return count of cavers', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/count')
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
