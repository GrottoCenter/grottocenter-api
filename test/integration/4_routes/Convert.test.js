const supertest = require('supertest');
const should = require('should');

describe('Convert features', () => {
  describe('GET /api/v1/convert', () => {
    it('should return list of projections', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          const firstProj = res.body[0];
          should(firstProj).have.property('definition');
          should(firstProj).have.property('title');
          should(firstProj).have.property('units');
          return done();
        });
    });

    it('should set Fr_name to World when not present', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const projWithoutCountry = res.body.find((p) => !p.iso);
          if (projWithoutCountry) {
            should(projWithoutCountry.Fr_name).equal('World');
          }
          return done();
        });
    });

    it('should parse proj from definition', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const projWithProj = res.body.find((p) => p.proj);
          if (projWithProj) {
            should(projWithProj.proj).be.a.String();
          }
          return done();
        });
    });
  });

  describe('GET /api/convert (legacy)', () => {
    it('should return list of projections', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          return done();
        });
    });
  });
});
