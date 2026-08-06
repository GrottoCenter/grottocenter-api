const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

const VALID_ROW = {
  id: '99999',
  'rdf:type': 'Entrance',
  'dct:rights/cc:attributionName': 'Author',
  'dct:rights/karstlink:licenseType': 'CC-BY-SA',
  'gn:countryCode': 'FR',
  'w3geo:latitude': '45.0',
  'w3geo:longitude': '6.0',
  'rdfs:label/dc:language': 'en',
  'rdfs:label': 'Test Entrance',
};

describe('Entrance features', () => {
  let adminToken;
  let userToken;
  let originalBoss;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
    originalBoss = sails.enrichmentBoss;
    sails.enrichmentBoss = { send: sinon.stub().resolves() };
  });

  after(() => {
    sails.enrichmentBoss = originalBoss;
  });

  describe('Import rows (async)', () => {
    let createBatchStub;

    beforeEach(() => {
      createBatchStub = sinon
        .stub(CSVImportQueueService, 'createBatch')
        .resolves({
          batchId: 'test-batch-id-123',
          totalRows: 3,
          totalChunks: 1,
        });
    });

    afterEach(() => {
      createBatchStub.restore();
    });

    it('should forbid non-admin users', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [VALID_ROW] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('not authorized');
          return done();
        });
    });

    it('should return 400 for empty data array', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('non-empty');
          return done();
        });
    });

    it('should return 400 for missing body', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({})
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('non-empty');
          return done();
        });
    });

    it('should return 400 when mandatory columns are missing on first row', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [{ 'dct:rights/cc:attributionName': 'Test' }] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Columns missing');
          return done();
        });
    });

    it('should return 202 with batchId for valid request', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [VALID_ROW] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(202)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('batchId', 'test-batch-id-123');
          should(res.body).have.property('totalRows', 3);
          should(res.body).have.property('totalChunks', 1);
          should(res.body).have.property(
            'statusUrl',
            '/api/v1/jobs/test-batch-id-123'
          );
          return done();
        });
    });

    it('should return 500 when job queue is unavailable', (done) => {
      const savedBoss = sails.enrichmentBoss;
      sails.enrichmentBoss = null;

      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [VALID_ROW] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500)
        .end((err) => {
          sails.enrichmentBoss = savedBoss;
          if (err) return done(err);
          return done();
        });
    });

    it('should return 500 when createBatch throws', (done) => {
      createBatchStub.rejects(new Error('DB connection failed'));

      supertest(sails.hooks.http.app)
        .post('/api/v1/entrances/import-rows')
        .send({ data: [VALID_ROW] })
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(500)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });
  });
});
