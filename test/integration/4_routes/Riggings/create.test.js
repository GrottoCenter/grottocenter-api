const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Rigging features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('create', () => {
    it('should return 400', (done) => {
      const newRigging = {
        body: 'new body',
        title: 'new title',
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/riggings')
        .send(newRigging)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 200', (done) => {
      const newRigging = {
        title: 'new title',
        entrance: 999,
        language: 'fra',
        obstacles: 'P5|;|P125',
        ropes: 'C10|;|C50|;|C70',
        anchors: '10 spits',
        observations: 'test|;|ok',
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/riggings')
        .send(newRigging)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const riggingUpdated = res.body;
          should(riggingUpdated.body).equals(newRigging.body);
          should(riggingUpdated.entrance.latitude).equals(30);
          should(riggingUpdated.author.mail).equals('user1@user1.com');
          should(riggingUpdated.ropes).equals(newRigging.ropes);
          return done();
        });
    });
  });
});
