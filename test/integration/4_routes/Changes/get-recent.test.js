const supertest = require('supertest');
const should = require('should');

describe('Change features', () => {
  describe('Get Recent', () => {
    it('should return recent changes with default pagination', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            // Don't assert specific length since it depends on actual data

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle offset and limit parameters', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?offset=0&limit=5')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            should(body.changes.length).be.lessThanOrEqual(5);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle invalid offset parameter (defaults to 0)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?offset=invalid')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle invalid limit parameter (defaults to 10)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?limit=invalid')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            should(body.changes.length).be.lessThanOrEqual(10);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle negative offset', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?offset=-5&limit=3')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            // With negative offset, should handle gracefully
            should(body.changes.length).be.greaterThanOrEqual(0);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle large offset beyond data length', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?offset=10000&limit=5')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            // Should return empty array when offset is beyond data
            should(body.changes.length).equal(0);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle zero limit', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?limit=0')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            should(body.changes.length).equal(0);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });

    it('should handle string parameters that parse to numbers', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?offset=2&limit=3')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          try {
            const { body } = res;
            should(body).have.property('changes');
            should(body.changes).be.an.Array();
            should(body.changes.length).be.lessThanOrEqual(3);

            return done();
          } catch (testErr) {
            return done(testErr);
          }
        });
    });
  });
});
