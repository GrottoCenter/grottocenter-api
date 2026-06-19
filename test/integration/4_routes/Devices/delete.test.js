const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Device features', () => {
  describe('delete', () => {
    let userToken;
    let moderatorToken;
    let adminToken;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    describe('Permission denied', () => {
      it('should return 403 for regular user', (done) => {
        supertest(sails.hooks.http.app)
          .delete('/api/v1/devices/1')
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Soft delete', () => {
      let deviceToSoftDeleteId;

      before(async () => {
        const device = await TDevice.create({
          name: 'Device To Soft Delete',
          author: 1,
        }).fetch();
        deviceToSoftDeleteId = device.id;
      });

      after(async () => {
        // Clean up if the record still exists (test DB has no trigger,
        // so destroyOne in the controller actually removes the record)
        const device = await TDevice.findOne({ id: deviceToSoftDeleteId });
        if (device) {
          await TDevice.destroyOne({ id: deviceToSoftDeleteId });
        }
      });

      it('should return 200 and the deleted device when Moderator soft-deletes a device', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/devices/${deviceToSoftDeleteId}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('id', deviceToSoftDeleteId);
            should(res.body).have.property('isDeleted', true);
            return done();
          });
      });
    });

    describe('Permanent delete', () => {
      describe('Permission check', () => {
        it('should return 403 when Moderator attempts permanent delete', (done) => {
          supertest(sails.hooks.http.app)
            .delete('/api/v1/devices/1?isPermanent=true')
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(403, done);
        });
      });

      describe('FK constraint', () => {
        let deviceWithConfigId;
        let quantityKindId;
        let unitId;
        let sensorConfigId;

        before(async () => {
          // Create a device to permanently delete
          const device = await TDevice.create({
            name: 'Device With Config',
            author: 1,
          }).fetch();
          deviceWithConfigId = device.id;

          // Create supporting records for sensor configuration
          const unit = await TUnit.create({
            code: 'test-kelvin',
            symbol: 'K',
            siToDisplayFactor: '1',
            siToDisplayOffset: '0',
          }).fetch();
          unitId = unit.id;

          const quantityKind = await TQuantityKind.create({
            code: 'test-temp',
            url: 'http://test.example.com/temp',
            symbolSi: 'K',
            displayUnit: unitId,
          }).fetch();
          quantityKindId = quantityKind.id;

          // Create a sensor configuration referencing the device
          const sensorConfig = await TSensorConfiguration.create({
            device: deviceWithConfigId,
            quantityKind: quantityKindId,
            unit: unitId,
          }).fetch();
          sensorConfigId = sensorConfig.id;
        });

        after(async () => {
          // Clean up in reverse order
          if (sensorConfigId) {
            await TSensorConfiguration.destroyOne({ id: sensorConfigId });
          }
          if (deviceWithConfigId) {
            await TDevice.destroyOne({ id: deviceWithConfigId });
          }
          if (unitId) {
            await TUnit.destroyOne({ id: unitId });
          }
          if (quantityKindId) {
            await TQuantityKind.destroyOne({ id: quantityKindId });
          }
        });

        it('should return 409 on permanent delete when device has sensor configurations', (done) => {
          supertest(sails.hooks.http.app)
            .delete(`/api/v1/devices/${deviceWithConfigId}?isPermanent=true`)
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(409, done);
        });
      });

      describe('Success', () => {
        let deviceToPermanentDeleteId;

        before(async () => {
          const device = await TDevice.create({
            name: 'Device To Permanently Delete',
            author: 1,
          }).fetch();
          deviceToPermanentDeleteId = device.id;
        });

        after(async () => {
          // Verify it's gone; clean up if somehow still there
          const device = await TDevice.findOne({
            id: deviceToPermanentDeleteId,
          });
          if (device) {
            await TDevice.destroyOne({ id: deviceToPermanentDeleteId });
          }
        });

        it('should return 200 and the deleted device when Administrator permanently deletes a device', (done) => {
          supertest(sails.hooks.http.app)
            .delete(
              `/api/v1/devices/${deviceToPermanentDeleteId}?isPermanent=true`
            )
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              should(res.body).have.property('id', deviceToPermanentDeleteId);
              should(res.body).have.property('isDeleted', true);
              return done();
            });
        });
      });
    });
  });
});
