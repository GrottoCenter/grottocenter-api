const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('SensorConfiguration features', () => {
  describe('restore', () => {
    let userToken;
    let moderatorToken;

    const DEVICE_ID = 1; // existing non-deleted device from fixtures
    const VALID_QUANTITY_KIND = 1;
    const VALID_UNIT = 1;
    const NON_EXISTENT_DEVICE_ID = 999999;
    const NON_EXISTENT_CONFIG_ID = 999999;
    const ACTIVE_CONFIG_ID = 1; // config 1 is not deleted

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    });

    describe('Permission denied', () => {
      it('should return 403 when regular user attempts restore', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations/2/restore`)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(403, done);
      });
    });

    describe('Not found', () => {
      it('should return 404 when config is not deleted (trying to restore an active config)', (done) => {
        supertest(sails.hooks.http.app)
          .post(
            `/api/v1/devices/${DEVICE_ID}/configurations/${ACTIVE_CONFIG_ID}/restore`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 when configuration does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .post(
            `/api/v1/devices/${DEVICE_ID}/configurations/${NON_EXISTENT_CONFIG_ID}/restore`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 404 when device does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .post(
            `/api/v1/devices/${NON_EXISTENT_DEVICE_ID}/configurations/2/restore`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });
    });

    describe('Success', () => {
      let configToRestoreId;

      before(async () => {
        // Create a soft-deleted config to restore
        const config = await TSensorConfiguration.create({
          device: DEVICE_ID,
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
          author: 1,
          dateInscription: new Date(),
          isDeleted: true,
        }).fetch();
        configToRestoreId = config.id;
      });

      after(async () => {
        if (configToRestoreId) {
          await TSensorConfiguration.destroyOne({ id: configToRestoreId });
        }
      });

      it('should return 200 and restore a soft-deleted configuration with populated response', (done) => {
        supertest(sails.hooks.http.app)
          .post(
            `/api/v1/devices/${DEVICE_ID}/configurations/${configToRestoreId}/restore`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config.id).equal(configToRestoreId);
            should(config.isDeleted).equal(false);
            should(config.device).equal(DEVICE_ID);

            // Should have populated associations
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property(
              'id',
              VALID_QUANTITY_KIND
            );
            should(config.quantityKind).have.property('code');

            should(config.unit).be.an.Object();
            should(config.unit).have.property('id', VALID_UNIT);
            should(config.unit).have.property('symbol');

            should(config.author).be.an.Object();
            should(config.author).have.property('id');

            return done();
          });
      });
    });
  });
});
