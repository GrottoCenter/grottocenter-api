const supertest = require('supertest');
const should = require('should');

describe('Country entrances data quality features', () => {
  describe('get-entrances-data-quality', () => {
    it('should return code 404 for empty country id', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 for non-existent country', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/XX')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return data quality for valid country', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('quality');
      should(res.body).have.property('totalCount');
      should(res.body).have.property('totalPages');
    });

    it('should respect limit parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR?limit=5')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should respect offset parameter', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR?offset=1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
