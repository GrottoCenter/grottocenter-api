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

    it('should return 403 if user is not author or moderator', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/guidelines/1') // Authored by user 3
        .send({ title: 'Attempted Title' })
        .set('Authorization', leaderToken) // User 7 is neither author (User 3) nor moderator
        .set('Content-type', 'application/json')
        .expect(403, done);
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
  });
});
