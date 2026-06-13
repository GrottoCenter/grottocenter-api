/**
 * Integration tests for POST /api/v1/observations/import
 *
 * Tests the controller-level behaviour (input validation, auth, error codes).
 * Sub-service calls are stubbed where needed to avoid real DB/Azure side effects.
 */
const path = require('path');
const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const FIXTURE_CSV = path.resolve(
  __dirname,
  '../../../fixtures/observation-import/temperature.csv'
);

// A minimal but structurally-valid profile referencing test fixture IDs.
// Used for cases where we want to test controller behaviour, not pipeline logic.
const VALID_PROFILE = JSON.stringify({
  timezone: 'Europe/Paris',
  authorIds: [1],
  licenseId: 1,
  caveId: 1,
  columnMappings: [
    { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
    { columnIndex: 1, role: 'measurement', sensorConfigurationId: 1 },
  ],
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  headerRow: 1,
});

describe('POST /api/v1/observations/import', () => {
  let userToken;
  // ObservationImportService is required inside before() so Sails has wrapped it
  // (sinon.stub works on the live Sails-modified version)
  let ObservationImportService;

  before(async () => {
    // eslint-disable-next-line global-require
    ObservationImportService = require('../../../../api/services/ObservationImportService');
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  // -------------------------------------------------------------------------
  // 1. Missing file → 400 IMPORT_MISSING_FILE
  // -------------------------------------------------------------------------
  describe('Missing file', () => {
    it('should return 400 with IMPORT_MISSING_FILE when no file is attached', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .field('profile', VALID_PROFILE)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);

      should(res.body).have.property('code', 'IMPORT_MISSING_FILE');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Missing profile → 400 IMPORT_MISSING_PROFILE
  // -------------------------------------------------------------------------
  describe('Missing profile', () => {
    it('should return 400 with IMPORT_MISSING_PROFILE when no profile field is sent', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .attach('file', FIXTURE_CSV)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);

      should(res.body).have.property('code', 'IMPORT_MISSING_PROFILE');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Malformed profile JSON → 400 IMPORT_MALFORMED_PROFILE
  // -------------------------------------------------------------------------
  describe('Malformed profile JSON', () => {
    it('should return 400 with IMPORT_MALFORMED_PROFILE when profile is not valid JSON', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .attach('file', FIXTURE_CSV)
        .field('profile', 'not valid json {{')
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);

      should(res.body).have.property('code', 'IMPORT_MALFORMED_PROFILE');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Unauthenticated request → 401
  // -------------------------------------------------------------------------
  describe('Unauthenticated request', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .attach('file', FIXTURE_CSV)
        .field('profile', VALID_PROFILE)
        .set('Accept', 'application/json')
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Validation error → 400 IMPORT_VALIDATION_ERROR
  //    Profile is valid JSON but missing required fields (no timezone, licenseId, etc.)
  // -------------------------------------------------------------------------
  describe('Profile validation error', () => {
    it('should return 400 with IMPORT_VALIDATION_ERROR when profile is missing required fields', async () => {
      const invalidProfile = JSON.stringify({
        // missing timezone, authorId, licenseId, columnMappings, caveId/pointLabel
        documentTitle: 'Test',
      });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .attach('file', FIXTURE_CSV)
        .field('profile', invalidProfile)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(400);

      should(res.body).have.property('code', 'IMPORT_VALIDATION_ERROR');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Successful import → 200 with correct response shape
  //    Stub ObservationImportService.execute to return a mock result
  // -------------------------------------------------------------------------
  describe('Successful import', () => {
    it('should return 200 with correct response shape on success', async () => {
      const mockResult = {
        observationId: 100,
        pointId: 50,
        documentId: 200,
        timeSeriesMap: { 10: 301, 20: 302 },
        measurementCount: 5,
        observationDate: new Date('2024-01-15T07:00:00.000Z'),
      };

      // Stub the service so no real DB / Azure calls happen
      sinon.stub(ObservationImportService, 'execute').resolves(mockResult);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/observations/import')
        .attach('file', FIXTURE_CSV)
        .field('profile', VALID_PROFILE)
        .set('Authorization', userToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body).have.property('observationId', 100);
      should(res.body).have.property('pointId', 50);
      should(res.body).have.property('documentId', 200);
      should(res.body.timeSeriesMap).be.an.Object();
      should(Object.keys(res.body.timeSeriesMap)).have.length(2);
      should(res.body).have.property('measurementCount', 5);
      should(res.body).have.property('observationDate');
    });
  });
});

// ---------------------------------------------------------------------------
// End-to-end test (5.13) — full pipeline with EntityBuilder stubbed
// to avoid real DB / Azure calls, but all other stages run for real.
// ---------------------------------------------------------------------------
describe('POST /api/v1/observations/import - E2E pipeline (EntityBuilder stubbed)', () => {
  let userToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should run ProfileValidator → ReferenceValidator → parser stages and fail at reference validation with unknown IDs', async () => {
    // Profile is structurally valid (passes ProfileValidator) but references
    // entity IDs that do not exist in the test DB (authorId: 99999 etc.).
    // This verifies the pipeline reaches ReferenceValidator with real DB checks.
    const profileWithBadRefs = JSON.stringify({
      timezone: 'Europe/Paris',
      authorIds: [99999],
      licenseId: 99999,
      caveId: 99999,
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' },
        { columnIndex: 1, role: 'measurement', sensorConfigurationId: 99999 },
      ],
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      headerRow: 1,
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/observations/import')
      .attach('file', FIXTURE_CSV)
      .field('profile', profileWithBadRefs)
      .set('Authorization', userToken)
      .set('Accept', 'application/json')
      .expect(400);

    should(res.body).have.property('code', 'IMPORT_REFERENCE_ERROR');
  });
});
