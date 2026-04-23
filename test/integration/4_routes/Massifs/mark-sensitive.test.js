const supertest = require('supertest');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');
const EntranceService = require('../../../../api/services/EntranceService');
const MassifService = require('../../../../api/services/MassifService');

describe('Massif mark-sensitive route features', () => {
  let adminToken;
  let userToken;
  let moderatorToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('POST /api/v1/massifs/:id/mark-sensitive', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should return 403 for user', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/mark-sensitive')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 403 for moderator (non-admin)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/mark-sensitive')
        .set('Authorization', moderatorToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/987654321/mark-sensitive')
        .set('Authorization', adminToken)
        .expect(404, done);
    });

    it('should return 200 and mark massif as sensitive for admin', async () => {
      sinon.stub(EntranceService, 'updateInSearch').resolves();
      sinon.stub(MassifService, 'updateInSearch').resolves();

      const massif = await TMassif.create({
        isSensitive: false,
        author: 1,
      }).fetch();
      await TName.create({
        massif: massif.id,
        name: 'Test Sensitive Massif Mark',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/mark-sensitive`)
        .set('Authorization', adminToken)
        .expect(200);

      const modified = await TMassif.findOne(massif.id);
      modified.isSensitive.should.be.true();

      // Cleanup
      await TName.destroy({ massif: massif.id });
      await TMassif.destroyOne(massif.id);
    });
  });
});
