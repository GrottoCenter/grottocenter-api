const supertest = require('supertest');
const should = require('should');

describe('Substance features', () => {
  describe('find', () => {
    // Fixtures: 3 substances
    // 1: Nitrate (formula: NO3-, casNumber: 14797-55-8, externalId: 943, externalSource: PubChem)
    // 2: Calcium (formula: Ca2+, no casNumber, no externalId)
    // 3: δ¹⁸O (no formula, no casNumber, no externalId)

    it('should return all substances with 200 when no search param', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/substances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body } = res;

          should(body).be.an.Array();
          should(body.length).be.aboveOrEqual(3);

          // Each result should have the expected fields
          body.forEach((substance) => {
            should(substance).have.property('id');
            should(substance).have.property('name');
            should(substance).have.property('formula');
            should(substance).have.property('casNumber');
            should(substance).have.property('externalId');
            should(substance).have.property('externalSource');
          });

          // Results should be ordered alphabetically by name
          for (let i = 1; i < body.length; i += 1) {
            should(
              body[i].name.localeCompare(body[i - 1].name)
            ).be.aboveOrEqual(0);
          }

          return done();
        });
    });

    it('should return matching substances with 200 when search param provided', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/substances?search=Nitr')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body } = res;

          should(body).be.an.Array();
          should(body.length).be.aboveOrEqual(1);

          // Should find Nitrate
          const nitrate = body.find((s) => s.name === 'Nitrate');
          should(nitrate).not.be.undefined();
          should(nitrate).have.property('id', 1);
          should(nitrate).have.property('formula', 'NO3-');
          should(nitrate).have.property('casNumber', '14797-55-8');
          should(nitrate).have.property('externalId', '943');
          should(nitrate).have.property('externalSource', 'PubChem');

          return done();
        });
    });

    it('should return 400 when search param is shorter than 2 characters', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/substances?search=N')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          const { body } = res;

          should(body).have.property(
            'message',
            'Search must be at least 2 characters'
          );

          return done();
        });
    });

    it('should return empty array with 200 when unauthenticated and no local results', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/substances?search=Zzzznonexistent')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body } = res;

          should(body).be.an.Array();
          should(body).have.length(0);

          return done();
        });
    });
  });
});
