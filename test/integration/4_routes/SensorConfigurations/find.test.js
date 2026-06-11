const supertest = require('supertest');
const should = require('should');

describe('SensorConfiguration features', () => {
  describe('find', () => {
    // Fixture data:
    // Config 1: device=1, quantityKind=1, unit=1, isDeleted=false, has reviewer
    // Config 2: device=1, quantityKind=2, unit=2, isDeleted=true (soft-deleted)
    // Config 3: device=3, quantityKind=1, unit=1, isDeleted=false
    const DEVICE_ID = 1;
    const CONFIG_ID = 1;
    const SOFT_DELETED_CONFIG_ID = 2;
    const CONFIG_ON_OTHER_DEVICE_ID = 3; // belongs to device 3
    const NON_EXISTENT_DEVICE_ID = 999999;
    const NON_EXISTENT_CONFIG_ID = 999999;

    it('should return 200 with populated associations', (done) => {
      supertest(sails.hooks.http.app)
        .get(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: config } = res;

          should(config).have.property('id', CONFIG_ID);
          should(config).have.property('device', DEVICE_ID);

          // quantityKind should be a populated object
          should(config.quantityKind).be.an.Object();
          should(config.quantityKind).have.property('id', 1);
          should(config.quantityKind).have.property('code');
          should(config.quantityKind).have.property('url');
          should(config.quantityKind).have.property('symbolSi');
          should(config.quantityKind).have.property('displaySymbol');
          should(config.quantityKind).have.property('siToDisplayFactor');
          should(config.quantityKind).have.property('siToDisplayOffset');

          // unit should be a populated object
          should(config.unit).be.an.Object();
          should(config.unit).have.property('id', 1);
          should(config.unit).have.property('code');
          should(config.unit).have.property('symbol');

          // author should be a populated simple caver
          should(config.author).be.an.Object();
          should(config.author).have.property('id');

          // reviewer should be a populated simple caver (config 1 has reviewer)
          should(config.reviewer).be.an.Object();
          should(config.reviewer).have.property('id');

          // Numeric fields
          should(config).have.property('precisionUpper');
          should(config).have.property('precisionLower');
          should(config).have.property('resolution');
          should(config).have.property('detectionLimitMin');
          should(config).have.property('detectionLimitMax');

          // Audit fields
          should(config).have.property('dateInscription');
          should(config).have.property('isDeleted', false);

          return done();
        });
    });

    it('should return 404 when device does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/devices/${NON_EXISTENT_DEVICE_ID}/configurations/${CONFIG_ID}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 when configuration does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/devices/${DEVICE_ID}/configurations/${NON_EXISTENT_CONFIG_ID}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 when configuration belongs to a different device', (done) => {
      // Config 3 belongs to device 3, not device 1
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ON_OTHER_DEVICE_ID}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for a soft-deleted configuration (public)', (done) => {
      // Config 2 is soft-deleted (isDeleted=true)
      // Without auth token (or without moderator role), should return 404
      supertest(sails.hooks.http.app)
        .get(
          `/api/v1/devices/${DEVICE_ID}/configurations/${SOFT_DELETED_CONFIG_ID}`
        )
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should allow public access without authentication', (done) => {
      // No auth token — should still work (public endpoint)
      supertest(sails.hooks.http.app)
        .get(`/api/v1/devices/${DEVICE_ID}/configurations/${CONFIG_ID}`)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: config } = res;
          should(config).have.property('id', CONFIG_ID);
          should(config.quantityKind).be.an.Object();
          should(config.unit).be.an.Object();
          return done();
        });
    });
  });
});
