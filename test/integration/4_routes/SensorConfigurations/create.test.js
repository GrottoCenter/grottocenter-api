const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('SensorConfiguration features', () => {
  describe('create', () => {
    let userToken;
    const DEVICE_ID = 1; // existing non-deleted device from fixtures
    const VALID_QUANTITY_KIND = 1; // Temperature
    const VALID_UNIT = 1; // °C
    const NON_EXISTENT_DEVICE_ID = 999999;
    const NON_EXISTENT_QUANTITY_KIND = 999999;
    const NON_EXISTENT_UNIT = 999999;

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Authentication', () => {
      it('should return 401 when no auth token provided', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({ quantityKind: VALID_QUANTITY_KIND, unit: VALID_UNIT })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Validation', () => {
      it('should return 400 when quantityKind is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({ unit: VALID_UNIT })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when quantityKind does not reference existing record', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({ quantityKind: NON_EXISTENT_QUANTITY_KIND, unit: VALID_UNIT })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when unit is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({ quantityKind: VALID_QUANTITY_KIND })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when unit does not reference existing record', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: VALID_QUANTITY_KIND,
            unit: NON_EXISTENT_UNIT,
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 404 when device does not exist', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${NON_EXISTENT_DEVICE_ID}/configurations`)
          .send({ quantityKind: VALID_QUANTITY_KIND, unit: VALID_UNIT })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return 400 when label exceeds 300 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: VALID_QUANTITY_KIND,
            unit: VALID_UNIT,
            label: 'x'.repeat(301),
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Success', () => {
      const createdIds = [];

      after(async () => {
        await Promise.all(
          createdIds.map((id) => TSensorConfiguration.destroyOne({ id }))
        );
      });

      it('should create successfully with all optional fields', (done) => {
        const payload = {
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
          precisionUpper: 0.5,
          precisionLower: -0.5,
          resolution: 0.01,
          detectionLimitMin: -40,
          detectionLimitMax: 85,
          label: 'Outdoor probe',
        };

        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send(payload)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id');
            should(config.id).be.a.Number();
            should(config.device).equal(DEVICE_ID);
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property(
              'id',
              VALID_QUANTITY_KIND
            );
            should(config.unit).be.an.Object();
            should(config.unit).have.property('id', VALID_UNIT);
            should(config.precisionUpper).equal(0.5);
            should(config.precisionLower).equal(-0.5);
            should(config.resolution).equal(0.01);
            should(config.detectionLimitMin).equal(-40);
            should(config.detectionLimitMax).equal(85);
            should(config.label).equal('Outdoor probe');
            should(config.dateInscription).not.be.empty();
            should(config.isDeleted).equal(false);
            should(config.author).be.an.Object();
            should(config.author).have.property('id');

            createdIds.push(config.id);
            return done();
          });
      });

      it('should create successfully with only required fields (quantityKind, unit)', (done) => {
        const payload = {
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
        };

        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send(payload)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id');
            should(config.id).be.a.Number();
            should(config.device).equal(DEVICE_ID);
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property(
              'id',
              VALID_QUANTITY_KIND
            );
            should(config.unit).be.an.Object();
            should(config.unit).have.property('id', VALID_UNIT);
            should(config.precisionUpper).be.null();
            should(config.precisionLower).be.null();
            should(config.resolution).be.null();
            should(config.detectionLimitMin).be.null();
            should(config.detectionLimitMax).be.null();
            should(config.dateInscription).not.be.empty();
            should(config.isDeleted).equal(false);
            should(config.author).be.an.Object();

            createdIds.push(config.id);
            return done();
          });
      });

      it('should allow duplicate quantityKind/unit combination on same device', (done) => {
        const payload = {
          quantityKind: VALID_QUANTITY_KIND,
          unit: VALID_UNIT,
        };

        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send(payload)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id');
            should(config.id).be.a.Number();
            should(config.device).equal(DEVICE_ID);
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property(
              'id',
              VALID_QUANTITY_KIND
            );
            should(config.unit).be.an.Object();
            should(config.unit).have.property('id', VALID_UNIT);

            createdIds.push(config.id);
            return done();
          });
      });
    });
  });
});
