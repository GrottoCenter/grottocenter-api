const supertest = require('supertest');
const should = require('should');

describe('Convert features', () => {
  describe('GET /api/v1/convert', () => {
    it('should return code 200 with an array of projections', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          return done();
        });
    });

    it('should include title, units, and proj fields on each projection', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.forEach((proj) => {
            should(proj).have.property('definition');
            should(proj).have.property('title');
            should(proj).have.property('units');
          });
          return done();
        });
    });

    it('should set Fr_name to World when country is not present', (done) => {
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

    it('should parse proj value from definition', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const projWithProj = res.body.find((p) => p.proj);
          should(projWithProj).not.be.undefined();
          should(projWithProj.proj).be.a.String();
          should(projWithProj.proj.length).be.greaterThan(0);
          return done();
        });
    });

    it('should not crash when definition has no +title= segment', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          // Fixture id=3 has no +title= in its definition
          const noTitleProj = res.body.find((p) => p.code === 'EPSG:NO_TITLE');
          should(noTitleProj).not.be.undefined();
          should(noTitleProj.title).equal('');
          return done();
        });
    });

    it('should parse units from definition or default to degrees', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/convert')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const withUnitsM = res.body.find((p) => p.code === 'SR-ORG:6892');
          should(withUnitsM).not.be.undefined();
          should(withUnitsM.units).equal('m');

          const withoutUnits = res.body.find((p) => p.code === 'EPSG:NO_TITLE');
          should(withoutUnits).not.be.undefined();
          should(withoutUnits.units).equal('degrees');
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
