const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver features', () => {
  let testCaverId;
  let testGroupId;

  before(async () => {
    testCaverId = 100;
    testGroupId = 1;
  });

  describe('Set groups', () => {
    it('should forbid non-admin users', async () => {
      const userToken = await AuthTokenService.getRawBearerUserToken();
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${testCaverId}/groups`)
        .send({ groups: [{ id: testGroupId }] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403)
        .then((res) => {
          should(res.body.message).containEql('not authorized');
        });
    });

    it('should return bad request when caver not found', async () => {
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      await supertest(sails.hooks.http.app)
        .post('/api/v1/cavers/999999/groups')
        .send({ groups: [{ id: testGroupId }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .then((res) => {
          should(res.body.message).containEql('Could not find caver');
        });
    });

    it('should return bad request when group not found', async () => {
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${testCaverId}/groups`)
        .send({ groups: [{ id: 999999 }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .then((res) => {
          should(res.body.message).containEql(
            'Could not find all given groups'
          );
        });
    });

    it('should set groups successfully', async () => {
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${testCaverId}/groups`)
        .send({ groups: [{ id: testGroupId }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const updatedCaver = await TCaver.findOne(testCaverId).populate('groups');
      should(updatedCaver.groups).be.an.Array();
    });

    it('should replace existing groups', async () => {
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      const group2 = await TGroup.findOne({ id: 2 });

      await TCaver.replaceCollection(testCaverId, 'groups', [testGroupId]);

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${testCaverId}/groups`)
        .send({ groups: [{ id: group2.id }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const updatedCaver = await TCaver.findOne(testCaverId).populate('groups');
      const groupIds = updatedCaver.groups.map((g) => g.id);
      should(groupIds).containEql(group2.id);
    });

    it('should revoke tokens after setting groups', async () => {
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      sails.services.blacklistservice.getCache().delete(testCaverId);

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/cavers/${testCaverId}/groups`)
        .send({ groups: [{ id: testGroupId }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const entry = sails.services.blacklistservice.getCache().get(testCaverId);
      should(entry).be.ok();
      should(entry).be.a.Date();
    });
  });
});
