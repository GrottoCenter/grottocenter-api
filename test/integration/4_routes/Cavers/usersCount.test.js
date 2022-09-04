const supertest = require('supertest');

describe('Caver features', () => {
  describe('Users count', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/cavers/users/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.deepEqual({ count: 6 });
          return done();
        });
    });
  });
});
