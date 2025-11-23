const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document check-rows', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('Check rows', () => {
    it('should return empty arrays for empty data', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/check-rows')
        .send({ data: [] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.willBeCreated).be.an.Array().with.length(0);
          should(res.body.willBeCreatedAsDuplicates)
            .be.an.Array()
            .with.length(0);
          should(res.body.wontBeCreated).be.an.Array().with.length(0);
          return done();
        });
    });

    it('should mark rows without id as wontBeCreated', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/check-rows')
        .send({
          data: [{ 'dct:rights/cc:attributionName': 'Test' }],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.wontBeCreated).have.length(1);
          should(res.body.wontBeCreated[0]).have.property('line', 2);
          return done();
        });
    });

    it('should mark rows without name as wontBeCreated', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/check-rows')
        .send({
          data: [{ id: '123' }],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.wontBeCreated).have.length(1);
          return done();
        });
    });

    it('should mark new documents as willBeCreated', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/check-rows')
        .send({
          data: [
            {
              id: '99999',
              'dct:rights/cc:attributionName': 'New Source',
            },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.willBeCreated).have.length(1);
          return done();
        });
    });

    it('should mark existing documents as willBeCreatedAsDuplicates', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        idDbImport: 88888,
        nameDbImport: 'Existing Source',
      }).fetch();

      try {
        await supertest(sails.hooks.http.app)
          .post('/api/v1/documents/check-rows')
          .send({
            data: [
              {
                id: '88888',
                'dct:rights/cc:attributionName': 'Existing Source',
              },
            ],
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .then((res) => {
            should(res.body.willBeCreatedAsDuplicates).have.length(1);
          });
      } finally {
        await TDocument.destroy({ id: doc.id });
      }
    });

    it('should handle mixed data correctly', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/documents/check-rows')
        .send({
          data: [
            { id: '77777', 'dct:rights/cc:attributionName': 'Source 1' },
            { id: '77778' },
            { 'dct:rights/cc:attributionName': 'Source 3' },
          ],
        })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.willBeCreated).have.length(1);
          should(res.body.wontBeCreated).have.length(2);
          return done();
        });
    });
  });
});
