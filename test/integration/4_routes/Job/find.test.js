const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

describe('Job features', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('GET /api/v1/jobs/:batchId', () => {
    let getBatchProgressStub;

    beforeEach(() => {
      getBatchProgressStub = sinon
        .stub(CSVImportQueueService, 'getBatchProgress')
        .resolves({
          totalChunks: 2,
          completedChunks: 2,
          totalRows: 100,
          processedRows: 100,
          successes: 95,
          duplicates: 0,
          failures: 5,
        });
    });

    afterEach(() => {
      getBatchProgressStub.restore();
    });

    it('should return 404 for non-existent batch', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/non-existent-batch-id')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return 200 for batch initiated by the requesting user (admin)', (done) => {
      // Fixture batch 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' has initiator = 1 (admin)
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property(
            'batchId',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
          );
          should(res.body).have.property('type', 'csv-import');
          should(res.body).have.property('status', 'completed');
          should(res.body).have.property('progress');
          should(res.body).have.property('result');
          should(res.body.result).have.property('reportUrls');
          should(res.body.result.reportUrls).have.property('successes');
          should(res.body.result.reportUrls).not.have.property('success');
          should(res.body.result).have.property('summary');
          should(res.body.result.summary).have.property('successes');
          return done();
        });
    });

    it('should return 404 for batch not initiated by the requesting user (non-admin)', (done) => {
      // Fixture batch 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' has initiator = 1 (admin),
      // userToken is for caver id 3 (user1, not admin, not moderator)
      // Returns 404 (not 403) to avoid leaking batch existence to non-owners.
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return 200 for batch initiated by another user when requester is admin', (done) => {
      // Fixture batch 'c3d4e5f6-a7b8-9012-cdef-123456789012' has initiator = 3 (user1)
      // adminToken is for caver id 1 (admin)
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/c3d4e5f6-a7b8-9012-cdef-123456789012')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property(
            'batchId',
            'c3d4e5f6-a7b8-9012-cdef-123456789012'
          );
          should(res.body).have.property('status', 'active');
          return done();
        });
    });

    it('should return 200 for batch initiated by the requesting user (regular user)', (done) => {
      // Fixture batch 'c3d4e5f6-a7b8-9012-cdef-123456789012' has initiator = 3 (user1)
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/c3d4e5f6-a7b8-9012-cdef-123456789012')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property(
            'batchId',
            'c3d4e5f6-a7b8-9012-cdef-123456789012'
          );
          return done();
        });
    });

    it('should include progress in response', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.progress).have.property('totalChunks', 2);
          should(res.body.progress).have.property('completedChunks', 2);
          should(res.body.progress).have.property('totalRows', 100);
          should(res.body.progress).have.property('processedRows', 100);
          should(res.body.progress).have.property('successes', 95);
          should(res.body.progress).have.property('duplicates', 0);
          should(res.body.progress).have.property('failures', 5);
          return done();
        });
    });
  });
});
