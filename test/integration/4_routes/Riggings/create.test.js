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
        obstacles: [
          {
            obstacle: 'P5',
            rope: 'C10',
            anchor: '10 spits',
            observation: 'test',
          },
          {
            obstacle: 'P125',
            rope: 'C150',
            anchor: '2 spits',
            observation: 'test',
          },
          { obstacle: 'P5', rope: 'C10', anchor: '1 spits' },
        ],
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
          should(riggingUpdated.ropes).equals('C10|;|C150|;|C10');
          return done();
        });
    });
  });
});
