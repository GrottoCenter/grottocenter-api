const should = require('should');
const sinon = require('sinon');
const CoordinatesSnapshotService = require('../../../api/services/CoordinatesSnapshotService');
const CommonService = require('../../../api/services/CommonService');

const sampleRows = [
  { longitude: '5.5', latitude: '43.3' },
  { longitude: '6.1', latitude: '44.2' },
  { longitude: '-2.5', latitude: '48.8' },
];

describe('CoordinatesSnapshotService', () => {
  let queryStub;
  let originalTTL;

  beforeEach(async () => {
    CoordinatesSnapshotService.reset();
    originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    sails.config.custom.coordinatesSnapshotTTL = 999999;
  });

  afterEach(() => {
    sails.config.custom.coordinatesSnapshotTTL = originalTTL;
    sinon.restore();
  });

  describe('load()', () => {
    it('should populate snapshot and set lastRefreshedAt', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });

      await CoordinatesSnapshotService.load();

      should(CoordinatesSnapshotService.isLoaded()).be.true();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.a.Date();

      const result = CoordinatesSnapshotService.getCoordinates(
        -90,
        -180,
        90,
        180
      );
      should(result).be.an.Array();
      should(result).have.length(3);
      should(result[0]).eql([5.5, 43.3]);
      should(result[1]).eql([6.1, 44.2]);
      should(result[2]).eql([-2.5, 48.8]);
    });

    it('should log error and preserve existing snapshot on failure', async () => {
      // First load succeeds
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();
      queryStub.restore();

      const firstRefreshedAt = CoordinatesSnapshotService.getLastRefreshedAt();
      const logStub = sinon.stub(sails.log, 'error');

      // Second load fails — load() now rejects after Bug 1 fix
      queryStub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB down'));
      try {
        await CoordinatesSnapshotService.load();
        should.fail('load() should have rejected');
      } catch (err) {
        should(err.message).equal('DB down');
      }

      should(logStub.calledOnce).be.true();
      should(CoordinatesSnapshotService.isLoaded()).be.true();
      // lastRefreshedAt should not have changed
      should(CoordinatesSnapshotService.getLastRefreshedAt()).equal(
        firstRefreshedAt
      );
      const result = CoordinatesSnapshotService.getCoordinates(
        -90,
        -180,
        90,
        180
      );
      should(result).have.length(3);
    });
  });

  describe('getCoordinates()', () => {
    it('should return null when snapshot is not loaded', () => {
      const result = CoordinatesSnapshotService.getCoordinates(40, 5, 45, 10);
      should(result).be.null();
    });

    it('should trigger background refresh when TTL expired', async () => {
      // Use a tiny TTL (0.001s = 1ms) so it expires quickly.
      sails.config.custom.coordinatesSnapshotTTL = 0.001;

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();

      // Wait long enough for the tiny TTL to expire
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      // Reset call count — same stub, new expectation
      queryStub.resetHistory();
      CoordinatesSnapshotService.getCoordinates(40, 5, 45, 10);

      // Background load() was triggered (fire-and-forget)
      should(queryStub.calledOnce).be.true();
    });
  });

  describe('single-flight guard', () => {
    it('should not trigger concurrent refreshes', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 0.001;

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();

      // Wait for the tiny TTL to expire
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      // Replace with a slow query that stays pending
      let resolveSecond;
      queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').returns(
        new Promise((resolve) => {
          resolveSecond = resolve;
        })
      );

      // First call triggers refresh
      CoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180);
      should(queryStub.calledOnce).be.true();

      // Second call should NOT trigger another refresh
      CoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180);
      should(queryStub.calledOnce).be.true();

      // Resolve to clean up
      resolveSecond({ rows: sampleRows });
    });
  });

  describe('clear()', () => {
    it('should trigger refresh without nullifying snapshot', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();
      queryStub.restore();

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      CoordinatesSnapshotService.clear();

      // Snapshot still available (not nullified)
      should(CoordinatesSnapshotService.isLoaded()).be.true();
      const result = CoordinatesSnapshotService.getCoordinates(
        -90,
        -180,
        90,
        180
      );
      should(result).be.an.Array();
      should(result).have.length(3);

      // Background load was triggered
      should(queryStub.calledOnce).be.true();

      // lastRefreshedAt is null (set by clear before async load completes)
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.null();
    });
  });

  describe('isLoaded()', () => {
    it('should return false when not loaded', () => {
      should(CoordinatesSnapshotService.isLoaded()).be.false();
    });

    it('should return true after load', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();
      should(CoordinatesSnapshotService.isLoaded()).be.true();
    });
  });

  describe('getLastRefreshedAt()', () => {
    it('should return null when not loaded', () => {
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.null();
    });

    it('should return a Date after load', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await CoordinatesSnapshotService.load();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.a.Date();
    });
  });
});
