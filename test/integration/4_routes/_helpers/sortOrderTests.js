const supertest = require('supertest');
const should = require('should');

/**
 * Shared sort/order integration tests for with-quality endpoints.
 * Call inside a describe() block — generates it() tests.
 *
 * @param {string} baseUrl - The endpoint URL that returns 200 for a valid entity
 *   e.g. '/api/v1/entrances/with-quality/massifs/1'
 * @param {Object} [options]
 * @param {boolean} [options.supportsMassifName=true] - Whether the endpoint
 *   supports sorting by massif_name. Country and region endpoints do not.
 */
const describeSortAndOrder = (baseUrl, options = {}) => {
  const { supportsMassifName = true } = options;

  it('should return 200 with valid sort and order', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`${baseUrl}?sort=entrance_name&order=desc`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    should(res.body).have.property('quality');
    should(res.body).have.property('totalCount');
    should(res.body).have.property('totalPages');
  });

  it('should return 400 for invalid sort column with descriptive message', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`${baseUrl}?sort=invalid_column`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(400);

    should(res.body).have.property('message');
    should(res.body.message).containEql('Invalid sort column');
    should(res.body.message).containEql('entrance_name');
  });

  it('should return 400 for invalid order value with descriptive message', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`${baseUrl}?sort=entrance_name&order=invalid`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(400);

    should(res.body).have.property('message');
    should(res.body.message).containEql('Invalid order value');
  });

  it('should return 200 with sort but no order (defaults to asc)', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`${baseUrl}?sort=entrance_name`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    should(res.body).have.property('quality');
    should(res.body).have.property('totalCount');
  });

  it('should return 200 with order but no sort (order ignored)', async () => {
    const res = await supertest(sails.hooks.http.app)
      .get(`${baseUrl}?order=desc`)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    should(res.body).have.property('quality');
    should(res.body).have.property('totalCount');
  });

  if (!supportsMassifName) {
    it('should return 400 when sorting by massif_name (not available on this endpoint)', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get(`${baseUrl}?sort=massif_name&order=asc`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);

      should(res.body).have.property('message');
      should(res.body.message).containEql('Invalid sort column');
    });
  }
};

module.exports = { describeSortAndOrder };
