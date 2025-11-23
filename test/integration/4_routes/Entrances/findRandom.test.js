const supertest = require('supertest');
const should = require('should');

describe('Entrance find random features', () => {
  describe('GET /api/v1/entrances/findRandom', () => {
    it('should return 200 and random entrance', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/findRandom')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id');
          return done();
        });
    });
  });
});
