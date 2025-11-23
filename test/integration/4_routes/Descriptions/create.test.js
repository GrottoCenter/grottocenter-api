const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Description create', () => {
  let userToken;
  let createdDescriptionId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  after(async () => {
    if (createdDescriptionId) {
      await TDescription.destroy({ id: createdDescriptionId });
    }
  });

  describe('POST /api/v1/descriptions', () => {
    it('should return 400 when missing title', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions')
        .send({ body: 'Test', language: 'eng', entrance: 1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing body', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions')
        .send({ title: 'Test', language: 'eng', entrance: 1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing language', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions')
        .send({ title: 'Test', body: 'Test', entrance: 1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should return 400 when missing linked entity', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions')
        .send({ title: 'Test', body: 'Test', language: 'eng' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should create description for entrance', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions')
        .send({
          title: 'Test',
          body: 'Test body',
          language: 'eng',
          entrance: 1,
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('id');
      should(res.body.title).equal('Test');
      createdDescriptionId = res.body.id;
    });
  });
});
