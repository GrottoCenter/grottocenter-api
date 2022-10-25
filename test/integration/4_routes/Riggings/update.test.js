const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Rigging features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('update', () => {
    it('should return 404 ', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/riggings/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200', (done) => {
      const update = {
        title: 'new title',
        language: 'fra',
        obstacles: [
          {
            obstacle: 'P5',
            rope: 'C10',
            anchor: '10 spits',
            observation: 'Quitter avant le fond sur la gauche.',
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
        .patch('/api/v1/riggings/3')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const riggingUpdated = res.body;
          should(riggingUpdated.title).equals(update.title);
          should(riggingUpdated.language.id).equals(update.language);
          should(riggingUpdated.entrance.latitude).equals(3);
          should(riggingUpdated.author.name).equals('Adrien');
          should(riggingUpdated.reviewer.name).equals('NewName');
          should(riggingUpdated.observations).equals(
            'Quitter avant le fond sur la gauche.|;|test|;|'
          );
          return done();
        });
    });
  });
});
