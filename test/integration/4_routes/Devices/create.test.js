const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Device features', () => {
  describe('create', () => {
    let userToken;
    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
    });

    describe('Authentication', () => {
      it('should return 401 when no token is provided', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({ name: 'Test Device' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(401, done);
      });
    });

    describe('Validation', () => {
      it('should return 400 when name is missing', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({ brandName: 'SomeBrand' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when name is blank (whitespace only)', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({ name: '   ' })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when name exceeds 300 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({ name: 'x'.repeat(301) })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when brandName exceeds 200 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({ name: 'Valid Device', brandName: 'b'.repeat(201) })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when productUrl exceeds 500 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({
            name: 'Valid Device',
            productUrl: `http://example.com/${'u'.repeat(500)}`,
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });

      it('should return 400 when manufacturerUrl exceeds 500 characters', (done) => {
        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send({
            name: 'Valid Device',
            manufacturerUrl: `http://example.com/${'m'.repeat(500)}`,
          })
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(400, done);
      });
    });

    describe('Success', () => {
      let createdDeviceId;

      after(async () => {
        if (createdDeviceId) {
          await TDevice.destroyOne({ id: createdDeviceId });
        }
      });

      it('should return 200 and create a device with valid data', (done) => {
        const deviceData = {
          name: 'Integration Test Device',
          brandName: 'TestBrand',
          productUrl: 'https://example.com/product',
          manufacturerUrl: 'https://example.com',
        };

        supertest(sails.hooks.http.app)
          .post('/api/v1/devices')
          .send(deviceData)
          .set('Authorization', userToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            const { body: device } = res;

            should(device).have.property('id');
            should(device.id).be.a.Number();
            should(device.name).equal('Integration Test Device');
            should(device.brandName).equal('TestBrand');
            should(device.productUrl).equal('https://example.com/product');
            should(device.manufacturerUrl).equal('https://example.com');
            should(device.dateInscription).not.be.empty();
            should(device.isDeleted).equal(false);
            should(device.author).be.an.Object();
            should(device.author).have.property('id');
            should(device.configurations).be.an.Array();

            createdDeviceId = device.id;
            return done();
          });
      });
    });
  });
});
