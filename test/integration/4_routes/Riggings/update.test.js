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
        observations: '|;|Quitter avant le fond sur la gauche.|;||;||;|',
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
          should(riggingUpdated.observations).equals(update.observations);
          return done();
        });
    });
  });
});
