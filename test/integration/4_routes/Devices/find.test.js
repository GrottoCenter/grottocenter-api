const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const DEVICE_PROPERTIES = [
  'id',
  'name',
  'brandName',
  'productUrl',
  'manufacturerUrl',
  'dateInscription',
  'dateReviewed',
  'isDeleted',
  'author',
  'reviewer',
  'configurations',
];

describe('Device features', () => {
  describe('find', () => {
    it('should return 404 for non-existent device', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/devices/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for device ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/devices/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for negative device ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/devices/-1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 200 with full representation for existing device', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/devices/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: device } = res;
          should(device).have.properties(DEVICE_PROPERTIES);
          should(device.id).equal(1);
          should(device.name).equal('Multi-Parameter Logger X100');
          should(device.author).be.an.Object();
          should(device.author).have.property('id');
          should(device.configurations).be.an.Array();
          return done();
        });
    });

    describe('Deleted device view', () => {
      it('should return 404 for non-moderator on soft-deleted device', (done) => {
        // Device 2 is soft-deleted in fixtures
        supertest(sails.hooks.http.app)
          .get('/api/v1/devices/2')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(404, done);
      });

      it('should return full representation for moderator on soft-deleted device', async () => {
        const moderatorToken =
          await AuthTokenService.getRawBearerModeratorToken();
        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/2')
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        const { body: device } = res;
        should(device).have.properties(DEVICE_PROPERTIES);
        should(device.id).equal(2);
        should(device.isDeleted).equal(true);
        should(device.name).equal('Temperature Probe T200');
      });
    });
  });
});
