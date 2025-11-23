const supertest = require('supertest');
const should = require('should');

describe('Massif entrances data quality features', () => {
  describe('get-entrances-data-quality', () => {
    it('should return code 404 for empty massif id', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/massifs/')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 for non-existent massif', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/massifs/999999')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return data quality for valid massif', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/massifs/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('quality');
      should(res.body).have.property('totalCount');
      should(res.body).have.property('totalPages');
    });

    it('should respect limit parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/massifs/1?limit=5')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should respect offset parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/massifs/1?offset=1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
