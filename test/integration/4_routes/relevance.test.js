const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../AuthTokenService');

describe('move-relevance routes', () => {
  let userToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('authentication', () => {
    it('should return 401 without auth token', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/1/move-relevance')
        .send({ direction: 1 })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });
  });

  describe('PATCH /api/v1/comments/:id/move-relevance', () => {
    // Create two comments with distinct relevance on entrance 999
    // so we can test a valid swap without interfering with other fixtures.
    let commentA;
    let commentB;

    before(async () => {
      commentA = await TComment.create({
        author: 2,
        title: 'Relevance test A',
        body: 'body A',
        entrance: 999,
        language: 'eng',
        relevance: 1,
        dateInscription: new Date(),
      }).fetch();

      commentB = await TComment.create({
        author: 2,
        title: 'Relevance test B',
        body: 'body B',
        entrance: 999,
        language: 'eng',
        relevance: 2,
        dateInscription: new Date(),
      }).fetch();
    });

    after(async () => {
      if (commentA) await TComment.destroyOne({ id: commentA.id });
      if (commentB) await TComment.destroyOne({ id: commentB.id });
    });

    it('should return 200 and swap relevance values', (done) => {
      supertest(sails.hooks.http.app)
        .patch(`/api/v1/comments/${commentA.id}/move-relevance`)
        .send({ direction: 1 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('moved');
          should(res.body).have.property('swapped');
          should(res.body.moved.relevance).equal(2);
          should(res.body.swapped.relevance).equal(1);
          return done();
        });
    });
  });

  describe('invalid direction', () => {
    it('should return 400 for direction 0', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/comments/1/move-relevance')
        .send({ direction: 0 })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
  });

  describe('routes exist for all entity types', () => {
    // Sending an invalid direction to each route: if the route exists
    // we get 400 (bad request), not 404 (not found).
    const entityRoutes = [
      '/api/v1/locations/1/move-relevance',
      '/api/v1/descriptions/1/move-relevance',
      '/api/v1/comments/1/move-relevance',
      '/api/v1/riggings/3/move-relevance',
      '/api/v1/histories/1/move-relevance',
    ];

    entityRoutes.forEach((route) => {
      it(`should respond with 400 (not 404) for ${route}`, (done) => {
        supertest(sails.hooks.http.app)
          .patch(route)
          .send({ direction: 0 })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });
  });
});
