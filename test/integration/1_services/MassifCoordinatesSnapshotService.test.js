const should = require('should');
const sinon = require('sinon');
const MassifCoordinatesSnapshotService = require('../../../api/services/MassifCoordinatesSnapshotService');
const CommonService = require('../../../api/services/CommonService');

const sampleRows = [
  { longitude: '5.5', latitude: '43.3' },
  { longitude: '6.1', latitude: '44.2' },
  { longitude: '-2.5', latitude: '48.8' },
];

describe('MassifCoordinatesSnapshotService', () => {
  let queryStub;
  let originalTTL;

  beforeEach(async () => {
    MassifCoordinatesSnapshotService.reset();
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

      await MassifCoordinatesSnapshotService.load();

      should(MassifCoordinatesSnapshotService.isLoaded()).be.true();
      should(MassifCoordinatesSnapshotService.getLastRefreshedAt()).be.a.Date();

      const result = MassifCoordinatesSnapshotService.getCoordinates(
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
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();
      queryStub.restore();

      const firstRefreshedAt =
        MassifCoordinatesSnapshotService.getLastRefreshedAt();
      const logStub = sinon.stub(sails.log, 'error');

      queryStub = sinon
        .stub(CommonService, 'query')
        .rejects(new Error('DB down'));
      try {
        await MassifCoordinatesSnapshotService.load();
        should.fail('load() should have rejected');
      } catch (err) {
        should(err.message).equal('DB down');
      }

      should(logStub.calledOnce).be.true();
      should(MassifCoordinatesSnapshotService.isLoaded()).be.true();
      should(MassifCoordinatesSnapshotService.getLastRefreshedAt()).equal(
        firstRefreshedAt
      );
      const result = MassifCoordinatesSnapshotService.getCoordinates(
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
      const result = MassifCoordinatesSnapshotService.getCoordinates(
        40,
        5,
        45,
        10
      );
      should(result).be.null();
    });

    it('should trigger background refresh when TTL expired', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 0.001;

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      queryStub.resetHistory();
      MassifCoordinatesSnapshotService.getCoordinates(40, 5, 45, 10);

      should(queryStub.calledOnce).be.true();
    });
  });

  describe('single-flight guard', () => {
    it('should not trigger concurrent refreshes', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 0.001;

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      let resolveSecond;
      queryStub.restore();
      queryStub = sinon.stub(CommonService, 'query').returns(
        new Promise((resolve) => {
          resolveSecond = resolve;
        })
      );

      MassifCoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180);
      should(queryStub.calledOnce).be.true();

      MassifCoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180);
      should(queryStub.calledOnce).be.true();

      resolveSecond({ rows: sampleRows });
    });
  });

  describe('invalidate()', () => {
    it('should trigger refresh without nullifying snapshot', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();
      queryStub.restore();

      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      MassifCoordinatesSnapshotService.invalidate();

      should(MassifCoordinatesSnapshotService.isLoaded()).be.true();
      const result = MassifCoordinatesSnapshotService.getCoordinates(
        -90,
        -180,
        90,
        180
      );
      should(result).be.an.Array();
      should(result).have.length(3);

      should(queryStub.calledOnce).be.true();

      // lastRefreshedAt is preserved (not nullified) so Cache-Control stays correct
      should(
        MassifCoordinatesSnapshotService.getLastRefreshedAt()
      ).not.be.null();
    });
  });

  describe('isLoaded()', () => {
    it('should return false when not loaded', () => {
      should(MassifCoordinatesSnapshotService.isLoaded()).be.false();
    });

    it('should return true after load', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();
      should(MassifCoordinatesSnapshotService.isLoaded()).be.true();
    });
  });

  describe('reset()', () => {
    it('should clear all state', async () => {
      queryStub = sinon
        .stub(CommonService, 'query')
        .resolves({ rows: sampleRows });
      await MassifCoordinatesSnapshotService.load();

      MassifCoordinatesSnapshotService.reset();

      should(MassifCoordinatesSnapshotService.isLoaded()).be.false();
      should(MassifCoordinatesSnapshotService.getLastRefreshedAt()).be.null();
      should(
        MassifCoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180)
      ).be.null();
    });
  });
});
