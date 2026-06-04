const supertest = require('supertest');
const should = require('should');

describe('Guideline find-for-entity', () => {
  describe('find-for-entity', () => {
    it('should return 400 when entityType is invalid', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/invalidType/1')
        .expect(400, done);
    });

    it('should return 200 with empty list if no guidelines exist', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/country/IT')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).equal(0);
          return done();
        });
    });

    it('should return 200 with empty list for non-existent entity', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/country/XX')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).equal(0);
          return done();
        });
    });

    // Regression: the dedicated /by-entity prefix means entity codes that
    // would previously have collided with the /:id/snapshots and /:id/restore
    // routes (returning 400 from validateId) now reach find-for-entity.
    it('should route entity codes that collide with sub-resource names', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/country/snapshots')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).equal(0);
          return done();
        });
    });

    it('should return 200 with guidelines list for country', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/country/FR')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          should(res.body[0].countries).containEql('FR');
          return done();
        });
    });

    it('should return 200 with guidelines list for region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/region/FR-01')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          should(res.body[0].regions).containEql('FR-01');
          return done();
        });
    });

    it('should return 200 with guidelines list for massif', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/guidelines/by-entity/massif/1')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          should(res.body[0].massifs.map((m) => m.id)).containEql(1);
          return done();
        });
    });
  });
});
