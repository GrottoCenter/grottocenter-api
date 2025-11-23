const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Location create', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/locations', () => {
    it('should return 400 when missing entrance', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/locations')
        .send({ body: 'Test', language: 'eng' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing body', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/locations')
        .send({ entrance: 1, language: 'eng' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing language', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/locations')
        .send({ entrance: 1, body: 'Test' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should create location for entrance', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/locations')
        .send({ entrance: 1, body: 'Test body', language: 'eng' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('id');
      should(res.body.body).equal('Test body');
    });
  });
});
