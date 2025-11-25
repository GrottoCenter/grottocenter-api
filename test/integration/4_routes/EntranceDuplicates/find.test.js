const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Entrance Duplicate features', () => {
  let userToken;
  let testEntranceId;
  let testDuplicateId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    testEntranceId = 1;

    const duplicate = await TEntranceDuplicate.create({
      author: 1,
      entrance: testEntranceId,
      content: {
        entrance: { latitude: 45.0, longitude: 6.0 },
        nameDescLoc: { name: { text: 'Test' } },
      },
      dateInscription: new Date(),
    });
    testDuplicateId = duplicate.id;
  });

  after(async () => {
    await TEntranceDuplicate.destroy({ id: testDuplicateId });
  });

  describe('Find', () => {
    it('should return bad request when duplicate not found', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates/999999')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find duplicate');
          return done();
        });
    });

    it('should return not found for entrance duplicate ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates/0')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Invalid ID');
          return done();
        });
    });

    it('should return not found for negative entrance duplicate ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrance-duplicates/-1')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Invalid ID');
          return done();
        });
    });

    it('should find entrance duplicate by id', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/entrance-duplicates/${testDuplicateId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('id', testDuplicateId);
          should(res.body).have.property('entrance');
          should(res.body).have.property('content');
          should(res.body).have.property('author');
          return done();
        });
    });

    it('should populate entrance data', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/entrance-duplicates/${testDuplicateId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.entrance).be.an.Object();
          should(res.body.entrance).have.property('id', testEntranceId);
          return done();
        });
    });

    it('should populate duplicate content', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/entrance-duplicates/${testDuplicateId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.content).be.an.Object();
          return done();
        });
    });
  });
});
