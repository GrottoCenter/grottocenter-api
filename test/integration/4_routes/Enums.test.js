const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../AuthTokenService');

const CONCEPT_PROPERTIES = ['id', 'code', 'url'];

// Stubs must target the globalized `EnumService` that the controllers call:
// Sails copies each service module into a new object when it globalizes it, so
// stubbing `require('api/services/EnumService')` would have no effect.

// Every public enum endpoint, with the service method backing it. Used to drive
// the behaviours that are identical across the six routes (public access, empty
// table, error path).
const ENDPOINTS = [
  {
    path: '/api/v1/enums/quantity-kinds',
    key: 'quantityKinds',
    method: 'getQuantityKinds',
  },
  { path: '/api/v1/enums/units', key: 'units', method: 'getUnits' },
  { path: '/api/v1/enums/media', key: 'media', method: 'getMedia' },
  {
    path: '/api/v1/enums/observation-types',
    key: 'observationTypes',
    method: 'getObservationTypes',
  },
  {
    path: '/api/v1/enums/human-activity-types',
    key: 'humanActivityTypes',
    method: 'getHumanActivityTypes',
  },
  {
    path: '/api/v1/enums/contaminant-types',
    key: 'contaminantTypes',
    method: 'getContaminantTypes',
  },
];

// The four tables sharing the { id, code, url } concept shape.
const CONCEPT_ENDPOINTS = ENDPOINTS.filter((e) =>
  [
    'media',
    'observationTypes',
    'humanActivityTypes',
    'contaminantTypes',
  ].includes(e.key)
);

describe('Enums reference endpoints', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('response shapes', () => {
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
          // Both branches of the displayUnit mapping must be exercised by the
          // fixtures, otherwise the `null` case above is never asserted.
          should(quantityKinds.some((qk) => qk.displayUnit === null)).be.true();
          should(
            quantityKinds.some(
              (qk) => qk.displayUnit !== null && qk.displayUnit.code
            )
          ).be.true();
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

    CONCEPT_ENDPOINTS.forEach(({ path, key }) => {
      it(`GET ${path} returns ${key} with Cache-Control`, (done) => {
        supertest(sails.hooks.http.app)
          .get(path)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const items = res.body[key];
            should(items).be.an.Array();
            should(res.headers['cache-control']).match(/^public, max-age=\d+/);
            for (const item of items) {
              should(item).have.properties(CONCEPT_PROPERTIES);
              should(item.id).be.a.Number();
              should(item.code).be.a.String();
              should(item.url).be.a.String();
            }
            return done();
          });
      });
    });
  });

  describe('public access', () => {
    let userToken;
    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    ENDPOINTS.forEach(({ path, key }) => {
      it(`GET ${path} returns the same body with and without an Authorization header`, async () => {
        const anonymous = await supertest(sails.hooks.http.app)
          .get(path)
          .expect(200);
        const authenticated = await supertest(sails.hooks.http.app)
          .get(path)
          .set('Authorization', userToken)
          .expect(200);

        should(authenticated.body[key]).be.an.Array();
        // The token is ignored, not rejected: same payload either way.
        should(authenticated.body).be.eql(anonymous.body);
      });
    });
  });

  describe('empty tables', () => {
    ENDPOINTS.forEach(({ path, key, method }) => {
      it(`GET ${path} returns 200 with an empty ${key} array, never 404`, async () => {
        sinon.stub(EnumService, method).resolves([]);

        const res = await supertest(sails.hooks.http.app).get(path).expect(200);

        should(res.body).have.property(key);
        should(res.body[key]).be.an.Array().and.have.length(0);
      });
    });
  });

  describe('error handling', () => {
    ENDPOINTS.forEach(({ path, method }) => {
      it(`GET ${path} returns 500 without a public Cache-Control header`, async () => {
        sinon.stub(EnumService, method).rejects(new Error('boom'));

        const res = await supertest(sails.hooks.http.app).get(path).expect(500);

        // Errors must never be cached by browsers or CDNs.
        should(res.headers['cache-control'] || '').not.match(/public/);
      });
    });
  });
});
