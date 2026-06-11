const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('SensorConfiguration features', () => {
  describe('update', () => {
    let userToken;
    let moderatorToken;
    const DEVICE_ID = 1; // existing non-deleted device from fixtures
    const CONFIG_ID = 1; // existing non-deleted config on device 1
    const VALID_QUANTITY_KIND = 1;
    const VALID_UNIT = 1;
    const NON_EXISTENT_DEVICE_ID = 999999;
    const NON_EXISTENT_CONFIG_ID = 999999;
    const NON_EXISTENT_QUANTITY_KIND = 999999;
    const NON_EXISTENT_UNIT = 999999;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    });

    describe('Authentication', () => {
      it('should return 401 when no auth token provided', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
          .send({ precisionUpper: 1.0 })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Authorization', () => {
      it('should return 403 when user is not the author and not a moderator', (done) => {
        // Config 1 has author=1 (admin), userToken is user id=3
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
          .send({ precisionUpper: 1.0 })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Validation', () => {
      it('should return 400 when no valid updatable fields are provided', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
          .send({})
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when quantityKind does not reference existing record', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
          .send({ quantityKind: NON_EXISTENT_QUANTITY_KIND })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when unit does not reference existing record', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
          .send({ unit: NON_EXISTENT_UNIT })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Not found', () => {
      it('should return 404 when configuration does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .patch(
            `/api/v1/devices/${DEVICE_ID}/configurations/${NON_EXISTENT_CONFIG_ID}`
          )
          .send({ precisionUpper: 1.0 })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 when device does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .patch(
            `/api/v1/devices/${NON_EXISTENT_DEVICE_ID}/configurations/${CONFIG_ID}`
          )
          .send({ precisionUpper: 1.0 })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Success', () => {
      let testConfigId;

      before(async () => {
        const config = await TSensorConfiguration.create({
          device: DEVICE_ID,
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
          precisionUpper: 0.5,
          precisionLower: -0.5,
          resolution: 0.01,
          detectionLimitMin: -40,
          detectionLimitMax: 85,
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        testConfigId = config.id;
      });

      after(async () => {
        if (testConfigId) {
          await TSensorConfiguration.destroyOne({ id: testConfigId });
        }
      });

      it('should partially update successfully (only precisionUpper)', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${testConfigId}`)
          .send({ precisionUpper: 2.0 })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config.id).equal(testConfigId);
            should(config.precisionUpper).equal(2.0);
            // Other fields should remain unchanged
            should(config.precisionLower).equal(-0.5);
            should(config.resolution).equal(0.01);
            should(config.detectionLimitMin).equal(-40);
            should(config.detectionLimitMax).equal(85);
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property(
              'id',
              VALID_QUANTITY_KIND
            );
            should(config.unit).be.an.Object();
            should(config.unit).have.property('id', VALID_UNIT);
            return done();
          });
      });

      it('should set reviewer on update', (done) => {
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/devices/${DEVICE_ID}/configurations/${testConfigId}`)
          .send({ resolution: 0.05 })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config.reviewer).be.an.Object();
            should(config.reviewer).have.property('id');
            should(config.dateReviewed).not.be.null();
            return done();
          });
      });
    });
  });
});
