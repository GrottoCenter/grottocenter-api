const supertest = require('supertest');
const should = require('should');

describe('Entrance count features', () => {
  describe('GET /api/v1/entrances/count', () => {
    it('should return count of non-deleted entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/count')
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

  describe('GET /api/v1/entrances/publicCount', () => {
    it('should return count of public non-deleted entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/publicCount')
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
