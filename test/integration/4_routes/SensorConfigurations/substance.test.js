const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('SensorConfiguration features', () => {
  describe('substance validation', () => {
    let adminToken;
    const DEVICE_ID = 1;
    const CONCENTRATION_QK = 4; // Concentration (substance-requiring)
    const TEMPERATURE_QK = 1; // Temperature (non-substance)
    const VALID_UNIT = 1;

    before(async () => {
      adminToken = await AuthTokenService.getRawBearerAdminToken();
    });

    describe('Create with substance', () => {
      const createdIds = [];

      after(async () => {
        await Promise.all(
          createdIds.map((id) => TSensorConfiguration.destroyOne({ id }))
        );
      });

      it('should create successfully with valid substance for Concentration QK', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: CONCENTRATION_QK,
            unit: VALID_UNIT,
            substance: 'NO₃⁻',
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id');
            should(config.substance).equal('NO₃⁻');
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property('id', CONCENTRATION_QK);

            createdIds.push(config.id);
            return done();
          });
      });

      it('should create successfully without substance for Temperature QK (substance is null)', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: TEMPERATURE_QK,
            unit: VALID_UNIT,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id');
            should(config.substance).be.null();
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property('id', TEMPERATURE_QK);

            createdIds.push(config.id);
            return done();
          });
      });

      it('should return 400 when substance exceeds 100 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: CONCENTRATION_QK,
            unit: VALID_UNIT,
            substance: 'x'.repeat(101),
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when Concentration QK and substance is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: CONCENTRATION_QK,
            unit: VALID_UNIT,
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when Temperature QK and substance is provided', (done) => {
        supertest(sails.hooks.http.app)
          .post(`/api/v1/devices/${DEVICE_ID}/configurations`)
          .send({
            quantityKind: TEMPERATURE_QK,
            unit: VALID_UNIT,
            substance: 'H₂O',
          })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Update with substance', () => {
      let configWithSubstance;
      let configWithoutSubstance;

      before(async () => {
        configWithSubstance = await TSensorConfiguration.create({
          device: DEVICE_ID,
          quantityKind: CONCENTRATION_QK,
          unit: VALID_UNIT,
          substance: 'NO₃⁻',
          author: 1,
          dateInscription: new Date(),
        }).fetch();

        configWithoutSubstance = await TSensorConfiguration.create({
          device: DEVICE_ID,
          quantityKind: TEMPERATURE_QK,
          unit: VALID_UNIT,
          substance: null,
          author: 1,
          dateInscription: new Date(),
        }).fetch();
      });

      after(async () => {
        if (configWithSubstance) {
          await TSensorConfiguration.destroyOne({ id: configWithSubstance.id });
        }
        if (configWithoutSubstance) {
          await TSensorConfiguration.destroyOne({
            id: configWithoutSubstance.id,
          });
        }
      });

      it('should update substance on a config with Concentration QK', (done) => {
        supertest(sails.hooks.http.app)
          .patch(
            `/api/v1/devices/${DEVICE_ID}/configurations/${configWithSubstance.id}`
          )
          .send({ substance: 'PO₄³⁻' })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config.id).equal(configWithSubstance.id);
            should(config.substance).equal('PO₄³⁻');
            return done();
          });
      });

      it('should auto-clear substance when QK changes from Concentration to Temperature', (done) => {
        supertest(sails.hooks.http.app)
          .patch(
            `/api/v1/devices/${DEVICE_ID}/configurations/${configWithSubstance.id}`
          )
          .send({ quantityKind: TEMPERATURE_QK })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config.id).equal(configWithSubstance.id);
            should(config.substance).be.null();
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property('id', TEMPERATURE_QK);
            return done();
          });
      });

      it('should return 400 when QK changes to Concentration without providing substance (existing is null)', (done) => {
        supertest(sails.hooks.http.app)
          .patch(
            `/api/v1/devices/${DEVICE_ID}/configurations/${configWithoutSubstance.id}`
          )
          .send({ quantityKind: CONCENTRATION_QK })
          .set('Authorization', adminToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Find returns substance', () => {
      // Fixture config 5 has substance: "NO₃⁻" with Concentration QK
      const CONFIG_WITH_SUBSTANCE = 5;

      it('should return substance field in find response', (done) => {
        supertest(sails.hooks.http.app)
          .get(
            `/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_WITH_SUBSTANCE}`
          )
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: config } = res;

            should(config).have.property('id', CONFIG_WITH_SUBSTANCE);
            should(config).have.property('substance', 'NO₃⁻');
            should(config.quantityKind).be.an.Object();
            should(config.quantityKind).have.property('code', 'Concentration');
            return done();
          });
      });
    });
  });
});
