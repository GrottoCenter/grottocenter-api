const supertest = require('supertest');
const should = require('should');

const CONCEPT_PROPERTIES = ['id', 'code', 'url'];

describe('Enums reference endpoints', () => {
  it('GET /api/v1/enums/quantity-kinds returns quantity kinds with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/quantity-kinds')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { quantityKinds } = res.body;
        should(quantityKinds).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const qk of quantityKinds) {
          should(qk).have.properties([
            'id',
            'code',
            'url',
            'symbolSi',
            'displayUnit',
          ]);
          should(qk.id).be.a.Number();
          should(qk.code).be.a.String();
          should(qk.url).be.a.String();
          should(qk.symbolSi).be.a.String();
          if (qk.displayUnit !== null) {
            should(qk.displayUnit).have.properties(['id', 'code', 'symbol']);
            should(qk.displayUnit.id).be.a.Number();
            should(qk.displayUnit.code).be.a.String();
            should(qk.displayUnit.symbol).be.a.String();
          }
        }
        return done();
      });
  });

  it('GET /api/v1/enums/units returns units with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/units')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { units } = res.body;
        should(units).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const u of units) {
          should(u).have.properties([
            'id',
            'code',
            'symbol',
            'dimension',
            'siToDisplayFactor',
            'siToDisplayOffset',
          ]);
          should(u.id).be.a.Number();
          should(u.code).be.a.String();
          should(u.symbol).be.a.String();
          should(u.dimension).be.a.String();
          // Strings to preserve PostgreSQL numeric precision.
          should(u.siToDisplayFactor).be.a.String();
          should(u.siToDisplayOffset).be.a.String();
        }
        return done();
      });
  });

  it('GET /api/v1/enums/media returns media with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/media')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { media } = res.body;
        should(media).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const m of media) {
          should(m).have.properties(CONCEPT_PROPERTIES);
          should(m.id).be.a.Number();
          should(m.code).be.a.String();
          should(m.url).be.a.String();
        }
        return done();
      });
  });

  it('GET /api/v1/enums/observation-types returns observation types with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/observation-types')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { observationTypes } = res.body;
        should(observationTypes).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const o of observationTypes) {
          should(o).have.properties(CONCEPT_PROPERTIES);
          should(o.id).be.a.Number();
          should(o.code).be.a.String();
          should(o.url).be.a.String();
        }
        return done();
      });
  });

  it('GET /api/v1/enums/human-activity-types returns human activity types with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/human-activity-types')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { humanActivityTypes } = res.body;
        should(humanActivityTypes).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const h of humanActivityTypes) {
          should(h).have.properties(CONCEPT_PROPERTIES);
          should(h.id).be.a.Number();
          should(h.code).be.a.String();
          should(h.url).be.a.String();
        }
        return done();
      });
  });

  it('GET /api/v1/enums/contaminant-types returns contaminant types with Cache-Control', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/enums/contaminant-types')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        const { contaminantTypes } = res.body;
        should(contaminantTypes).be.an.Array();
        should(res.headers['cache-control']).match(/^public, max-age=\d+/);
        for (const c of contaminantTypes) {
          should(c).have.properties(CONCEPT_PROPERTIES);
          should(c.id).be.a.Number();
          should(c.code).be.a.String();
          should(c.url).be.a.String();
        }
        return done();
      });
  });
});
