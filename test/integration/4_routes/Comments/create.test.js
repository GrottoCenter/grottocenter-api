const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Comment features', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });
  describe('create', () => {
    it('should return 400', (done) => {
      const newComment = {
        title: 'new title',
        body: 'new body',
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments')
        .send(newComment)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 200', (done) => {
      const newComment = {
        title: 'new title',
        body: 'new body',
        entrance: 999,
        language: 'fra',
        eTUnderground: '04:05:06',
        eTTrail: '02:03:04',
        aestheticism: 5,
        caving: 4,
        approach: 3,
      };
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments')
        .send(newComment)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const commentUpdated = res.body;
          should(commentUpdated.body).equals(newComment.body);
          should(commentUpdated.entrance.latitude).equals(30);
          should(commentUpdated.author.mail).equals('user1@user1.com');
          should(commentUpdated.aestheticism).equals(newComment.aestheticism);
          should(commentUpdated.eTUnderground.hours).equals(4);
          return done();
        });
    });
  });
});
