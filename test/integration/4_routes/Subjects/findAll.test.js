const supertest = require('supertest');
const should = require('should');

describe('Subject find all features', () => {
  describe('GET /api/v1/documents/subjects', () => {
    it('should return 200 and list of subjects', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/documents/subjects')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('subjects');
          should(res.body.subjects).be.an.Array();
          return done();
        });
    });
  });
});
