const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let moderatorToken;
  let adminToken;
  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 404 when caver does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/999999')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 403 when trying to delete default deleted caver', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/8')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should delete an author as moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/5')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should return 403 when moderator tries to delete a caver with password', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/6')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should delete a caver with password as admin', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/101')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should return 400 when merge target does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/100?entityId=999999')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should return 400 when entityId is not a valid number', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/100?entityId=true')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should merge source caver data into target and delete source', async () => {
      // Verify source caver exists and has data before merge
      const sourceBefore = await TCaver.findOne(102)
        .populate('exploredCaves')
        .populate('documents')
        .populate('subscribedToRegions');
      should(sourceBefore).not.be.null();
      should(sourceBefore.exploredCaves).have.length(1);
      should(sourceBefore.documents).have.length(1);
      should(sourceBefore.subscribedToRegions).have.length(1);

      // Verify target caver before merge
      const targetBefore = await TCaver.findOne(103)
        .populate('exploredCaves')
        .populate('documents')
        .populate('subscribedToRegions');
      should(targetBefore).not.be.null();
      should(targetBefore.exploredCaves).have.length(1);
      should(targetBefore.documents).have.length(1);
      should(targetBefore.subscribedToRegions).have.length(0);

      // Perform the merge
      const res = await supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/102?entityId=103')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('id', 102);

      // Verify source caver is deleted
      const sourceAfter = await TCaver.findOne(102);
      should(sourceAfter).be.undefined();

      // Verify target caver received the merged data
      const targetAfter = await TCaver.findOne(103)
        .populate('exploredCaves')
        .populate('documents')
        .populate('subscribedToRegions');
      should(targetAfter).not.be.null();
      // Target should have its own cave (4) + source's cave (3)
      should(targetAfter.exploredCaves).have.length(2);
      const exploredCaveIds = targetAfter.exploredCaves.map((c) => c.id);
      should(exploredCaveIds).containDeep([3, 4]);
      // Target should have its own document (4) + source's document (3)
      should(targetAfter.documents).have.length(2);
      const documentIds = targetAfter.documents.map((d) => d.id);
      should(documentIds).containDeep([3, 4]);
      // Target should have source's region subscription (FR-01)
      should(targetAfter.subscribedToRegions).have.length(1);
      should(targetAfter.subscribedToRegions[0].id).equal('FR-01');
    });
  });
});
