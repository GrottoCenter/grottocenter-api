const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver create', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/cavers/', () => {
    it('should return 400 when missing name', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/')
        .send({ surname: 'Test' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing surname', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/')
        .send({ name: 'Test' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should create caver', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/')
        .send({ name: 'John', surname: 'Doe' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('id');
    });
  });
});
