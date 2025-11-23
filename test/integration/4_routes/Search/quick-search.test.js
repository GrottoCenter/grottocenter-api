const supertest = require('supertest');

describe('Search quick-search', () => {
  describe('POST /api/v1/search', () => {
    it('should return 400 when missing query', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({})
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 404 for non-existent query', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({ query: 'nonexistentquerythatdoesnotexist12345' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });
  });
});
