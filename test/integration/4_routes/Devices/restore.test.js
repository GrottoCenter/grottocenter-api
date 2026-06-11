const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Device features', () => {
  describe('restore', () => {
    let userToken;
    let moderatorToken;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    });

    describe('Permission denied', () => {
      it('should return 403 for regular user', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices/2/restore')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Not found', () => {
      it('should return 404 for device that is not deleted', (done) => {
        // Device 1 is not deleted in fixtures
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices/1/restore')
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 for non-existent device', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices/987654321/restore')
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Success', () => {
      let deviceToRestoreId;

      before(async () => {
        // Create a device then mark it as soft-deleted directly
        // (test DB has no histo_delete trigger, so we set isDeleted manually)
        const device = await TDevice.create({
          name: 'Device To Restore',
          author: 1,
          isDeleted: true,
        }).fetch();
        deviceToRestoreId = device.id;
      });

      after(async () => {
        if (deviceToRestoreId) {
          await TDevice.destroyOne({ id: deviceToRestoreId });
        }
      });

      it('should return 200 and restore a soft-deleted device', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${deviceToRestoreId}/restore`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: device } = res;

            should(device.id).equal(deviceToRestoreId);
            should(device.isDeleted).equal(false);
            should(device.name).equal('Device To Restore');
            return done();
          });
      });
    });
  });
});
