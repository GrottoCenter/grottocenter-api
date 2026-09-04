const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline update', () => {
  let userToken;
  let moderatorToken;
  let leaderToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    leaderToken = await AuthTokenService.getRawBearerLeaderToken();
  });

  describe('update', () => {
    it('should return 404 if guideline does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/999999')
        .send({ title: 'New Title' })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .expect(404, done);
    });

    it('should return 400 when title is empty', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ title: '   ' })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when title exceeds 150 chars', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ title: 'a'.repeat(151) })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when description exceeds 500 chars', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ description: 'a'.repeat(501) })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when language is invalid', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ language: 'xyz' })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when no updatable field is supplied', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({})
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(400, done);
    });

    // Preservation baseline — Req 3.8: tokenAuth policy must remain unchanged
    it('[PRESERVATION] should return 401 when no authorization token is provided', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ title: 'No Auth' })
        .set('Content-type', 'application/json')
        .expect(401, done);
    });

    it('should successfully update guideline and trigger history snapshot creation', async () => {
      const payload = {
        title: 'Updated Title By Moderator',
        description: 'New Description',
        language: 'fra',
      };

      const res = await supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send(payload)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(200);

      const guideline = res.body;
      should(guideline.title).equal(payload.title);
      should(guideline.description).equal(payload.description);

      // Verify trigger-based snapshot exists in h_guideline
      const snapshots = await HGuideline.find({ t_id: 1 });
      should(snapshots.length).be.greaterThan(1);
    });

    // Regression cases for the two guards removed in this change (issue #1775).

    it('should allow any authenticated user (non-author, non-moderator, non-admin) to update a guideline', (done) => {
      // leaderToken is user 7 — authenticated, but not the author (user 3),
      // not a moderator and not an admin: exactly the caller the removed
      // author-check rejected with 403.
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ title: 'Updated By Leader' })
        .set('Authorization', leaderToken)
        .set('Content-type', 'application/json')
        .expect(200, done);
    });

    it('should allow PATCH with all geo associations set to empty arrays', (done) => {
      // All effective geo collections empty. The removed guard rejected this
      // with 400 "At least one country, region, or massif must be specified.";
      // a guideline with no geographic scope is now valid and persists as such.
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1')
        .send({ countries: [], regions: [], massifs: [] })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .expect(200, done);
    });
  });
});
