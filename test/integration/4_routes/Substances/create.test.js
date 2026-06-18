const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Substance features', () => {
  describe('create', () => {
    let userToken;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Authentication', () => {
      it('should return 401 when no auth token provided', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/substances')
          .send({ name: 'Unauthenticated Substance' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/substances')
          .send({ formula: 'H2O' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            const { body } = res;
            should(body).have.property('message', 'Name is required');
            return done();
          });
      });

      it('should return 400 when name exceeds 200 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/substances')
          .send({ name: 'x'.repeat(201) })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            const { body } = res;
            should(body).have.property(
              'message',
              'Name must not exceed 200 characters'
            );
            return done();
          });
      });
    });

    describe('Success', () => {
      const createdIds = [];

      after(async () => {
        await Promise.all(
          createdIds.map((id) => TSubstance.destroyOne({ id }))
        );
      });

      it('should return 201 when creating a valid new substance', (done) => {
        const payload = {
          name: 'Test Substance Create',
          formula: 'TSC',
          casNumber: '12345-67-8',
          externalId: '99999',
        };

        supertest(sails.hooks.http.app)
          .post('/api/v1/substances')
          .send(payload)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(201)
          .end((err, res) => {
            if (err) return done(err);
            const { body } = res;

            should(body).have.property('id');
            should(body.id).be.a.Number();
            should(body).have.property('name', 'Test Substance Create');
            should(body).have.property('formula', 'TSC');
            should(body).have.property('casNumber', '12345-67-8');
            should(body).have.property('externalId', '99999');
            should(body).have.property('externalSource', 'PubChem');

            createdIds.push(body.id);
            return done();
          });
      });

      it('should return 200 with existing record when name already exists', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/substances')
          .send({ name: 'Nitrate' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body } = res;

            should(body).have.property('id', 1);
            should(body).have.property('name', 'Nitrate');
            should(body).have.property('formula', 'NO3-');
            should(body).have.property('casNumber', '14797-55-8');
            should(body).have.property('externalId', '943');
            should(body).have.property('externalSource', 'PubChem');

            return done();
          });
      });
    });
  });
});
