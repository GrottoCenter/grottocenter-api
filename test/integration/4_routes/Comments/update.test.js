const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Comment features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });
  describe('update own', () => {
    it('should return 404 ', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/123456789')
        .send({})
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200', (done) => {
      const update = {
        body: 'new body',
        language: 'fra',
        eTTrail: '01:54:04',
        eTUnderground: '00:30:01',
        aestheticism: 5,
      };
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/2')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const commentUpdated = res.body;
          should(commentUpdated.body).equals(update.body);
          should(commentUpdated.language).equals(update.language);
          should(commentUpdated.author.nickname).equals('NewNickname');
          should(commentUpdated.eTTrail).equals('01:54:04');
          should(commentUpdated.eTUnderground).equals('00:30:01');
          should(commentUpdated.aestheticism).equals(update.aestheticism);
          return done();
        });
    });
  });
  describe('update any', () => {
    const update = {
      body: 'new body',
      language: 'fra',
      eTTrail: '01:54:04',
      eTUnderground: '00:30:01',
      aestheticism: 5,
    };
    it('should return 403', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/3')
        .send(update)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
    it('should return 200', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/3')
        .send(update)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const commentUpdated = res.body;
          should(commentUpdated.body).equals(update.body);
          should(commentUpdated.language).equals(update.language);
          should(commentUpdated.author.nickname).equals('Admin1');
          should(commentUpdated.eTTrail).equals('01:54:04');
          should(commentUpdated.eTUnderground).equals('00:30:01');
          should(commentUpdated.aestheticism).equals(update.aestheticism);
          return done();
        });
    });
  });
});
