const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const CaverService = require('../../../../api/services/CaverService');
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

    it('should keep the source and its links when the target disappears during the merge', async () => {
      const source = await CaverService.createNonUserCaver({
        name: 'VanishingMergeSource',
      });
      const target = await CaverService.createNonUserCaver({
        name: 'VanishingMergeTarget',
      });
      await TCaver.addToCollection(source.id, 'exploredEntrances', [4, 5]);

      // The controller's existence check sees the target; every later lookup
      // behaves as if a concurrent request had deleted it in between.
      const originalFindOne = TCaver.findOne.bind(TCaver);
      let targetLookups = 0;
      const findOneStub = sinon
        .stub(TCaver, 'findOne')
        .callsFake((criteria, ...rest) => {
          if (criteria === target.id) {
            targetLookups += 1;
            if (targetLookups > 1) return { populate: async () => undefined };
          }
          return originalFindOne(criteria, ...rest);
        });

      try {
        await supertest(sails.hooks.http.app)
          .delete(`/api/v1/cavers/${source.id}?entityId=${target.id}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(409);
      } finally {
        findOneStub.restore();
      }
      should(targetLookups).be.above(1);

      const sourceAfter = await TCaver.findOne(source.id).populate(
        'exploredEntrances'
      );
      should(sourceAfter).not.be.undefined();
      should(sourceAfter.exploredEntrances.map((e) => e.id)).containDeep([
        4, 5,
      ]);

      await TCaver.replaceCollection(source.id, 'exploredEntrances', []);
      await TCaver.destroy({ id: [source.id, target.id] });
    });

    it('should merge source caver data into target and delete source', async () => {
      // Verify source caver exists and has data before merge
      const sourceBefore = await TCaver.findOne(102)
        .populate('exploredEntrances')
        .populate('documents')
        .populate('subscribedToRegions');
      should(sourceBefore).not.be.null();
      should(sourceBefore.exploredEntrances).have.length(2);
      should(sourceBefore.documents).have.length(1);
      should(sourceBefore.subscribedToRegions).have.length(1);

      // Verify target caver before merge
      const targetBefore = await TCaver.findOne(103)
        .populate('exploredEntrances')
        .populate('documents')
        .populate('subscribedToRegions');
      should(targetBefore).not.be.null();
      should(targetBefore.exploredEntrances).have.length(1);
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

      // toCaver converts documents as citations, so the response must carry
      // the citation fields that getCaver alone does not populate.
      should(res.body.documents).have.length(1);
      should(res.body.documents[0]).have.property('id', 3);
      should(res.body.documents[0]).have.property('identifierType', 'issn');
      const citationAuthorIds = res.body.documents[0].authors.map((a) => a.id);
      should(citationAuthorIds).containDeep([102]);

      // Verify source caver is deleted
      const sourceAfter = await TCaver.findOne(102);
      should(sourceAfter).be.undefined();

      // Verify target caver received the merged data
      const targetAfter = await TCaver.findOne(103)
        .populate('exploredEntrances')
        .populate('documents')
        .populate('subscribedToRegions');
      should(targetAfter).not.be.null();
      // Target should have its own entrance (6) + source's entrances (4, 5)
      should(targetAfter.exploredEntrances).have.length(3);
      const exploredEntranceIds = targetAfter.exploredEntrances.map(
        (e) => e.id
      );
      should(exploredEntranceIds).containDeep([4, 5, 6]);
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
