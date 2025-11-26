const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver explored cave endpoints', () => {
  let userToken;
  let userId;
  let testCave;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const tokenData = await AuthTokenService.getUserToken();
    userId = tokenData.id;

    // Create test cave
    testCave = await TCave.create({
      author: userId,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();
  });

  after(async () => {
    // Cleanup
    if (testCave) await TCave.destroyOne({ id: testCave.id });
  });

  describe('PUT /api/v1/caves/:caveId/cavers/:caverId', () => {
    it('should add cave to caver', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Verify the cave was added
          const caver = await TCaver.findOne(userId).populate('exploredCaves');
          const hasCave = caver.exploredCaves.some((c) => c.id === testCave.id);
          should(hasCave).be.true();

          return done();
        });
    });

    it('should return 404 for non-existent cave', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/999999/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 400 when caver already explores cave', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
  });

  describe('DELETE /api/v1/caves/:caveId/cavers/:caverId', () => {
    it('should remove cave from caver', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .end(async (err) => {
          if (err) return done(err);

          // Verify the cave was removed
          const caver = await TCaver.findOne(userId).populate('exploredCaves');
          const hasCave = caver.exploredCaves.some((c) => c.id === testCave.id);
          should(hasCave).be.false();

          return done();
        });
    });

    it('should return 404 for non-existent cave', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/999999/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 400 when caver does not explore cave', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });
  });
});
