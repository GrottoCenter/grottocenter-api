const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

// A delete sent twice at once used to load the organization before the first
// one flagged it: the slower request then sent a DELETE on a row already
// soft-deleted, which the t_grotto trigger lets through as a hard delete. In
// production its authorship rows made it fail on the foreign key (#1921); the
// test database has no foreign keys, so here the row would simply vanish.
describe('Organization features', () => {
  describe('Delete - Concurrency', () => {
    let adminToken;
    let GrottoService;

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
      // Required here: the controllers use the modules Sails loaded on lift
      // eslint-disable-next-line global-require
      GrottoService = require('../../../../api/services/GrottoService');
    });

    afterEach(() => sinon.restore());

    const deleteOrganization = (id, query = '') =>
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${id}${query}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

    const createAuthoredOrganization = async () => {
      const org = await TGrotto.create({ author: 1 }).fetch();
      const doc = await TDocument.create({ author: 1, type: 1 }).fetch();
      await JDocumentGrottoAuthor.create({ document: doc.id, grotto: org.id });
      return { org, doc };
    };

    it('should keep the organization when a concurrent request already soft-deleted it', async () => {
      const { org, doc } = await createAuthoredOrganization();
      const target = await TGrotto.create({ author: 1 }).fetch();
      const staleSnapshot = await GrottoService.getPopulatedOrganization(
        org.id
      );

      // The faster request wins
      await deleteOrganization(org.id, `?entityId=${target.id}`).expect(200);

      // The slower one still holds the snapshot it loaded before
      const stub = sinon.stub(GrottoService, 'getPopulatedOrganization');
      stub.onFirstCall().resolves(staleSnapshot);
      stub.callThrough();

      const res = await deleteOrganization(
        org.id,
        `?entityId=${target.id}`
      ).expect(200);
      should(stub.callCount).be.above(0);
      should(res.body.isDeleted).be.true();

      const kept = await TGrotto.findOne(org.id);
      should(kept).not.be.undefined();
      should(kept.isDeleted).be.true();
      should(kept.redirectTo).equal(target.id);
      should(await JDocumentGrottoAuthor.find({ grotto: org.id })).have.length(
        1
      );

      await JDocumentGrottoAuthor.destroy({ grotto: org.id });
      await TDocument.destroy({ id: doc.id });
    });

    it('should not move the redirection of an organization a concurrent request already soft-deleted', async () => {
      const org = await TGrotto.create({ author: 1 }).fetch();
      const first = await TGrotto.create({ author: 1 }).fetch();
      const second = await TGrotto.create({ author: 1 }).fetch();
      const staleSnapshot = await GrottoService.getPopulatedOrganization(
        org.id
      );

      await deleteOrganization(org.id, `?entityId=${first.id}`).expect(200);

      const stub = sinon.stub(GrottoService, 'getPopulatedOrganization');
      stub.onFirstCall().resolves(staleSnapshot);
      stub.callThrough();

      await deleteOrganization(org.id, `?entityId=${second.id}`).expect(200);
      should(stub.callCount).be.above(0);

      const kept = await TGrotto.findOne(org.id);
      should(kept.isDeleted).be.true();
      should(kept.redirectTo).equal(first.id);
    });

    it('should keep the organization when two soft deletes overlap', async () => {
      const { org, doc } = await createAuthoredOrganization();

      const responses = await Promise.all([
        deleteOrganization(org.id),
        deleteOrganization(org.id),
      ]);

      should(responses.map((r) => r.status)).eql([200, 200]);
      const kept = await TGrotto.findOne(org.id);
      should(kept).not.be.undefined();
      should(kept.isDeleted).be.true();
      should(await JDocumentGrottoAuthor.find({ grotto: org.id })).have.length(
        1
      );

      await JDocumentGrottoAuthor.destroy({ grotto: org.id });
      await TDocument.destroy({ id: doc.id });
    });
  });
});
