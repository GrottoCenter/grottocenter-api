const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let adminToken;
  let userToken;
  let testCaverId;
  let testGroupId;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    testCaverId = 1;
    testGroupId = 1;
  });

  describe('Put on group', () => {
    afterEach(async () => {
      await TCaver.addToCollection(testCaverId, 'groups', testGroupId);
    });

    it('should forbid non-admin users', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/cavers/${testCaverId}/groups/${testGroupId}`)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return bad request when caver not found', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/999999/groups/1')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find caver');
          return done();
        });
    });

    it('should return bad request when group not found', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/cavers/${testCaverId}/groups/999999`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Could not find group');
          return done();
        });
    });

    it('should add caver to group successfully', async () => {
      await TCaver.removeFromCollection(testCaverId, 'groups', testGroupId);

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/cavers/${testCaverId}/groups/${testGroupId}`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      const caver = await TCaver.findOne(testCaverId).populate('groups');
      const groupIds = caver.groups.map((g) => g.id);
      should(groupIds).containEql(testGroupId);
    });
  });
});
