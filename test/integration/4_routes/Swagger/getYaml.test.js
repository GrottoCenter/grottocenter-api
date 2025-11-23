const supertest = require('supertest');

describe('Swagger get yaml features', () => {
  describe('GET /api/v1/swagger.yaml', () => {
    it('should return 200 and yaml file', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/swagger.yaml')
        .expect(200)
        .expect('Content-Type', /yaml/)
        .end(done);
    });
  });
});
