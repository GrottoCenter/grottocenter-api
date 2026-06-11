const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('SensorConfiguration features', () => {
  describe('delete', () => {
    let userToken;
    let moderatorToken;
    let adminToken;

    const DEVICE_ID = 1; // existing non-deleted device from fixtures
    const VALID_QUANTITY_KIND = 1;
    const VALID_UNIT = 1;
    const NON_EXISTENT_DEVICE_ID = 999999;
    const NON_EXISTENT_CONFIG_ID = 999999;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    describe('Permission denied', () => {
      it('should return 403 when regular user attempts delete', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/devices/${DEVICE_ID}/configurations/1`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });

      it('should return 403 when moderator attempts permanent delete', (done) => {
        supertest(sails.hooks.http.app)
          .delete(
            `/api/v1/devices/${DEVICE_ID}/configurations/1?isPermanent=true`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Not found', () => {
      it('should return 404 when configuration does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .delete(
            `/api/v1/devices/${DEVICE_ID}/configurations/${NON_EXISTENT_CONFIG_ID}`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 when device does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/devices/${NON_EXISTENT_DEVICE_ID}/configurations/1`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Soft delete', () => {
      let configToSoftDeleteId;

      before(async () => {
        const config = await TSensorConfiguration.create({
          device: DEVICE_ID,
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
          author: 1,
          dateInscription: new Date(),
        }).fetch();
        configToSoftDeleteId = config.id;
      });

      after(async () => {
        // Clean up if still exists
        const config = await TSensorConfiguration.findOne({
          id: configToSoftDeleteId,
        });
        if (config) {
          await TSensorConfiguration.destroyOne({ id: configToSoftDeleteId });
        }
      });

      it('should return 200 and the deleted configuration when Moderator soft-deletes a configuration', (done) => {
        supertest(sails.hooks.http.app)
          .delete(
            `/api/v1/devices/${DEVICE_ID}/configurations/${configToSoftDeleteId}`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            should(res.body).have.property('id', configToSoftDeleteId);
            should(res.body).have.property('isDeleted', true);
            return done();
          });
      });
    });

    describe('Permanent delete', () => {
      describe('Success', () => {
        let configToPermanentDeleteId;

        before(async () => {
          const config = await TSensorConfiguration.create({
            device: DEVICE_ID,
            quantityKind: VALID_QUANTITY_KIND,
            unit: VALID_UNIT,
            author: 1,
            dateInscription: new Date(),
          }).fetch();
          configToPermanentDeleteId = config.id;
        });

        after(async () => {
          // Verify it's gone; clean up if somehow still there
          const config = await TSensorConfiguration.findOne({
            id: configToPermanentDeleteId,
          });
          if (config) {
            await TSensorConfiguration.destroyOne({
              id: configToPermanentDeleteId,
            });
          }
        });

        it('should return 200 and the deleted configuration when Administrator permanently deletes a configuration', (done) => {
          supertest(sails.hooks.http.app)
            .delete(
              `/api/v1/devices/${DEVICE_ID}/configurations/${configToPermanentDeleteId}?isPermanent=true`
            )
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              should(res.body).have.property('id', configToPermanentDeleteId);
              should(res.body).have.property('isDeleted', true);
              return done();
            });
        });
      });

      describe('FK constraint', () => {
        let configWithTimeSeriesId;
        let observationTypeId;
        let observationId;
        let timeSeriesId;

        before(async () => {
          // Create a sensor configuration
          const config = await TSensorConfiguration.create({
            device: DEVICE_ID,
            quantityKind: VALID_QUANTITY_KIND,
            unit: VALID_UNIT,
            author: 1,
            dateInscription: new Date(),
          }).fetch();
          configWithTimeSeriesId = config.id;

          // Create supporting records for time series
          const observationType = await TObservationType.create({
            code: 'test-physical',
            url: 'http://test.example.com/physical',
          }).fetch();
          observationTypeId = observationType.id;

          const observation = await TObservation.create({
            author: 1,
            dateInscription: new Date(),
            observationType: observationTypeId,
            observationTypeCode: 'test-physical',
          }).fetch();
          observationId = observation.id;

          // Create a time series referencing the sensor configuration
          const timeSeries = await TTimeSeries.create({
            author: 1,
            dateInscription: new Date(),
            observation: observationId,
            sensorConfiguration: configWithTimeSeriesId,
            quantityKindCode: 'temperature',
            unitSymbol: '°C',
          }).fetch();
          timeSeriesId = timeSeries.id;
        });

        after(async () => {
          // Clean up in reverse order
          if (timeSeriesId) {
            await TTimeSeries.destroyOne({ id: timeSeriesId });
          }
          if (observationId) {
            await TObservation.destroyOne({ id: observationId });
          }
          if (observationTypeId) {
            await TObservationType.destroyOne({ id: observationTypeId });
          }
          if (configWithTimeSeriesId) {
            // The config might have been soft-deleted during the test
            const config = await TSensorConfiguration.findOne({
              id: configWithTimeSeriesId,
            });
            if (config) {
              // If soft-deleted, destroy again for hard delete
              if (config.isDeleted) {
                await TSensorConfiguration.destroyOne({
                  id: configWithTimeSeriesId,
                });
              }
              // If still exists and not deleted, destroy twice
              const remaining = await TSensorConfiguration.findOne({
                id: configWithTimeSeriesId,
              });
              if (remaining) {
                await TSensorConfiguration.destroyOne({
                  id: configWithTimeSeriesId,
                });
              }
            }
          }
        });

        it('should return 409 when config has associated time series', (done) => {
          supertest(sails.hooks.http.app)
            .delete(
              `/api/v1/devices/${DEVICE_ID}/configurations/${configWithTimeSeriesId}?isPermanent=true`
            )
            .set('Authorization', adminToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(409, done);
        });
      });
    });
  });
});
