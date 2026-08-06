const supertest = require('supertest');

describe('Massif statistics features', () => {
  describe('get-statistics', () => {
    it('should return code 404 for empty massif id', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs//statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 for non-existent massif', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/999999/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for a non-numeric massif id', async () => {
      // Number('abc') === NaN — Waterline would throw E_INVALID_PK_VALUE (500).
      // The guard must intercept this before the DB lookup.
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/abc/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for a soft-deleted massif', async () => {
      // Massif 102 exists in t_massif but has is_deleted = true.
      // The controller must check the real table, not the view.
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/102/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 200 with zero stats for a massif absent from the materialized view', async () => {
      // Massif 101 exists in t_massif but has no rows in v_massif_info.
      // Before this fix, the view-based existence check caused a 404.
      const response = await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/101/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      response.body.nb_caves.should.equal(0);
    });

    it('should return statistics for valid massif', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
