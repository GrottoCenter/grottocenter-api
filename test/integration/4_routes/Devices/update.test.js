const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Device features', () => {
  describe('update', () => {
    let userToken;
    let moderatorToken;
    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    });

    describe('Authentication', () => {
      it('should return 401 when no token is provided', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({ name: 'Updated Name' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Authorization', () => {
      it('should return 403 when user is not the author and not a moderator', (done) => {
        // Device 1 has author=1 (admin), userToken is user id=3
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({ name: 'Attempted Update' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Validation', () => {
      it('should return 400 when no updatable fields are provided', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({})
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when name is blank (whitespace only)', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({ name: '   ' })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when name exceeds 300 characters', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({ name: 'x'.repeat(301) })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when serialNumber exceeds 200 characters', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/1')
          .send({ serialNumber: 's'.repeat(201) })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Not found', () => {
      it('should return 404 for non-existent device', (done) => {
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/987654321')
          .send({ name: 'Updated' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 for soft-deleted device', (done) => {
        // Device 2 is soft-deleted in fixtures
        supertest(sails.hooks.http.app)
          .patch('/api/v1/devices/2')
          .send({ name: 'Updated' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Success', () => {
      let testDeviceId;
      const originalName = 'Update Test Device';
      const originalBrand = 'OriginalBrand';
      const originalProductUrl = 'https://example.com/original';

      before(async () => {
        const device = await TDevice.create({
          name: originalName,
          brandName: originalBrand,
          productUrl: originalProductUrl,
          author: 1,
        }).fetch();
        testDeviceId = device.id;
      });

      after(async () => {
        if (testDeviceId) {
          await TDevice.destroyOne({ id: testDeviceId });
        }
      });

      it('should return 200 and update only the provided field (partial update)', (done) => {
        const newName = 'Partially Updated Device';
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${testDeviceId}`)
          .send({ name: newName })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: device } = res;

            should(device.id).equal(testDeviceId);
            should(device.name).equal(newName);
            // Other fields should remain unchanged
            should(device.brandName).equal(originalBrand);
            should(device.productUrl).equal(originalProductUrl);
            // Reviewer should be set
            should(device.reviewer).be.an.Object();
            should(device.reviewer).have.property('id');
            return done();
          });
      });

      it('should update serialNumber field', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${testDeviceId}`)
          .send({ serialNumber: 'SN-UPDATED-999' })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: device } = res;

            should(device.id).equal(testDeviceId);
            should(device.serialNumber).equal('SN-UPDATED-999');
            return done();
          });
      });
    });
  });
});
