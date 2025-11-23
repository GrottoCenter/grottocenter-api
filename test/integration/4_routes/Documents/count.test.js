const supertest = require('supertest');

describe('Document count', () => {
  describe('Count', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.have.property('count');
          res.body.count.should.be.a.Number();
          res.body.count.should.be.greaterThanOrEqual(6);
          return done();
        });
    });
  });
});
