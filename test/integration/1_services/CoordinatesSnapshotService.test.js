const should = require('should');
const sinon = require('sinon');
const etag = require('etag');
const CoordinatesSnapshotService = require('../../../api/services/CoordinatesSnapshotService');
const GeoLocService = require('../../../api/services/GeoLocService');

// One row per size, with and without quality data and rating. The quality
// columns not listed are absent, as when the view has no row for the entrance.
const sampleRows = [
  {
    longitude: '5.5',
    latitude: '43.3',
    depth: 120,
    length: null,
    aestheticism: 7.65,
    general_latest_date_of_update: new Date(),
    general_nb_contributions: 1,
  },
  {
    longitude: '6.1',
    latitude: '44.2',
    depth: 30,
    length: 50,
    aestheticism: null,
  },
  {
    longitude: '-2.5',
    latitude: '48.8',
    depth: null,
    length: null,
    aestheticism: null,
  },
];

const sampleTuples = [
  [5.5, 43.3, 3, 10, 7.7],
  [6.1, 44.2, 2, 0, null],
  [-2.5, 48.8, 1, 0, null],
];

const extraRow = {
  longitude: '1.25',
  latitude: '42.5',
  depth: 0,
  length: 1000,
  aestheticism: '8',
};

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const deferred = () => {
  const d = {};
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
};

const world = () =>
  CoordinatesSnapshotService.getCoordinates(-90, -180, 90, 180);

describe('CoordinatesSnapshotService', () => {
  let rowsStub;
  let originalTTL;
  let originalRetryDelay;

  const stubRows = (rows) => {
    if (rowsStub) rowsStub.restore();
    rowsStub = sinon
      .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
      .resolves(rows);
    return rowsStub;
  };

  const stubFailure = (message = 'DB down') => {
    if (rowsStub) rowsStub.restore();
    rowsStub = sinon
      .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
      .rejects(new Error(message));
    return rowsStub;
  };

  // A load that never settles, so an accessor called on an unloaded snapshot
  // cannot reach the database or publish into a later test.
  const holdLoads = () => {
    if (rowsStub) rowsStub.restore();
    rowsStub = sinon
      .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
      .returns(new Promise(() => {}));
    return rowsStub;
  };

  beforeEach(() => {
    CoordinatesSnapshotService.reset();
    originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    originalRetryDelay = sails.config.custom.coordinatesSnapshotRetryDelay;
    sails.config.custom.coordinatesSnapshotTTL = 999999;
    sails.config.custom.coordinatesSnapshotRetryDelay = 999999;
  });

  afterEach(() => {
    sails.config.custom.coordinatesSnapshotTTL = originalTTL;
    sails.config.custom.coordinatesSnapshotRetryDelay = originalRetryDelay;
    rowsStub = null;
    sinon.restore();
    CoordinatesSnapshotService.reset();
  });

  describe('load()', () => {
    it('should build enriched tuples and set lastRefreshedAt', async () => {
      stubRows(sampleRows);

      await CoordinatesSnapshotService.load();

      should(CoordinatesSnapshotService.isLoaded()).be.true();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.a.Date();
      should(world()).eql(sampleTuples);
    });

    it('should log the error and keep the published snapshot on failure', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      const before = CoordinatesSnapshotService.getWorldResponse();
      const refreshedAt = CoordinatesSnapshotService.getLastRefreshedAt();
      const logStub = sinon.stub(sails.log, 'error');

      stubFailure();
      await CoordinatesSnapshotService.load().should.be.rejectedWith('DB down');

      should(logStub.calledOnce).be.true();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).equal(
        refreshedAt
      );
      const after = CoordinatesSnapshotService.getWorldResponse();
      should(after.body).equal(before.body);
      should(after.etag).equal(before.etag);
      should(world()).eql(sampleTuples);
    });

    it('should leave the snapshot unloaded when the first load fails', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure();

      await CoordinatesSnapshotService.load().should.be.rejected();

      should(CoordinatesSnapshotService.isLoaded()).be.false();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.null();
    });
  });

  describe('getWorldResponse()', () => {
    it('should return null when the snapshot is not loaded, and start a load', () => {
      const stub = holdLoads();

      should(CoordinatesSnapshotService.getWorldResponse()).be.null();
      should(stub.calledOnce).be.true();
    });

    it('should return the serialized tuples as a UTF-8 buffer', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();

      const { body } = CoordinatesSnapshotService.getWorldResponse();

      should(Buffer.isBuffer(body)).be.true();
      should(body.toString('utf8')).equal(
        '[[5.5,43.3,3,10,7.7],[6.1,44.2,2,0,null],[-2.5,48.8,1,0,null]]'
      );
      should(JSON.parse(body.toString('utf8'))).eql(world());
    });

    it('should return the weak ETag Express generates for the same bytes', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();

      const response = CoordinatesSnapshotService.getWorldResponse();

      should(response.etag).match(/^W\/"[0-9a-f]+-[A-Za-z0-9+/]+"$/);
      should(response.etag).equal(etag(response.body, { weak: true }));
    });

    it('should return the same buffer on every call, without copying it', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();

      should(CoordinatesSnapshotService.getWorldResponse().body).equal(
        CoordinatesSnapshotService.getWorldResponse().body
      );
    });

    it('should serialize an interest that overflows to Infinity as null', async () => {
      // One rating of 1e308 averages to 1e308; rounding it to one decimal
      // multiplies by 10 and overflows.
      stubRows([
        { longitude: 2, latitude: 45, aestheticism: 1e308 },
        { longitude: 3, latitude: 46, aestheticism: -1e308 },
      ]);
      await CoordinatesSnapshotService.load();

      const { body } = CoordinatesSnapshotService.getWorldResponse();

      should(body.toString('utf8')).equal('[[2,45,1,0,null],[3,46,1,0,null]]');
      should(world()).eql([
        [2, 45, 1, 0, null],
        [3, 46, 1, 0, null],
      ]);
    });

    it('should serialize an unparseable coordinate as null', async () => {
      stubRows([{ longitude: 'not a number', latitude: 45 }]);
      await CoordinatesSnapshotService.load();

      const { body } = CoordinatesSnapshotService.getWorldResponse();

      should(JSON.parse(body.toString('utf8'))).eql([[null, 45, 1, 0, null]]);
      should(world()).eql([[null, 45, 1, 0, null]]);
    });

    it('should serialize an empty dataset as an empty array', async () => {
      stubRows([]);
      await CoordinatesSnapshotService.load();

      const { body } = CoordinatesSnapshotService.getWorldResponse();
      should(body.toString('utf8')).equal('[]');
    });

    it('should return the old response and trigger exactly one load when the TTL expired', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      const before = CoordinatesSnapshotService.getWorldResponse();
      sails.config.custom.coordinatesSnapshotTTL = 0.001;
      await wait(10);

      const pending = deferred();
      rowsStub.restore();
      rowsStub = sinon
        .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
        .returns(pending.promise);

      const during = CoordinatesSnapshotService.getWorldResponse();
      CoordinatesSnapshotService.getWorldResponse();

      should(during.body).equal(before.body);
      should(rowsStub.callCount).equal(1);
      pending.resolve(sampleRows);
    });
  });

  describe('getCoordinates()', () => {
    it('should return null when the snapshot is not loaded, and start a load', () => {
      const stub = holdLoads();

      should(
        CoordinatesSnapshotService.getCoordinates(40, 5, 45, 10)
      ).be.null();
      should(stub.calledOnce).be.true();
    });

    it('should return only the tuples strictly inside a bounding box', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();

      should(CoordinatesSnapshotService.getCoordinates(43, 5, 45, 7)).eql([
        [5.5, 43.3, 3, 10, 7.7],
        [6.1, 44.2, 2, 0, null],
      ]);
    });

    it('should trigger a background refresh when the TTL expired', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 0.001;
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      await wait(10);

      rowsStub.resetHistory();
      CoordinatesSnapshotService.getCoordinates(40, 5, 45, 10);

      should(rowsStub.calledOnce).be.true();
    });

    it('should not trigger concurrent refreshes', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 0.001;
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      await wait(10);

      const pending = deferred();
      rowsStub.restore();
      rowsStub = sinon
        .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
        .returns(pending.promise);

      world();
      world();

      should(rowsStub.calledOnce).be.true();
      pending.resolve(sampleRows);
    });
  });

  describe('retry delay', () => {
    const failOnceAfterLoad = async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      sinon.stub(sails.log, 'error');
      stubFailure();
      await CoordinatesSnapshotService.load().should.be.rejected();
      sails.config.custom.coordinatesSnapshotTTL = 0.001;
      await wait(10);
      rowsStub.resetHistory();
    };

    it('should not start an automatic load within the retry delay of a failure', async () => {
      await failOnceAfterLoad();

      world();
      CoordinatesSnapshotService.getWorldResponse();

      should(rowsStub.callCount).equal(0);
    });

    it('should start one automatic load once the retry delay has passed', async () => {
      await failOnceAfterLoad();
      sails.config.custom.coordinatesSnapshotRetryDelay = 0.001;
      await wait(10);
      stubRows(sampleRows);

      world();
      world();

      should(rowsStub.callCount).equal(1);
    });

    it('should default to 300 seconds', () => {
      delete sails.config.custom.coordinatesSnapshotRetryDelay;
      should(CoordinatesSnapshotService.getRetryDelay()).equal(300);
    });
  });

  describe('invalidate()', () => {
    it('should return a promise of a reload, keeping the snapshot in service meanwhile', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      stubRows([...sampleRows, extraRow]);

      const promise = CoordinatesSnapshotService.invalidate();

      should(promise).be.a.Promise();
      should(world()).eql(sampleTuples);
      await promise;
      should(world()).have.length(4);
      should(world()[3]).eql([1.25, 42.5, 3, 0, 8]);
    });

    it('should reload within the retry delay of a failure', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure();
      await CoordinatesSnapshotService.load().should.be.rejected();
      stubRows(sampleRows);

      await CoordinatesSnapshotService.invalidate();

      should(rowsStub.calledOnce).be.true();
      should(CoordinatesSnapshotService.isLoaded()).be.true();
    });

    it('should reject when its load fails, so the caller can log it', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure('invalidate failed');

      await CoordinatesSnapshotService.invalidate().should.be.rejectedWith(
        'invalidate failed'
      );
    });

    it('should share its load with a concurrent load() call', async () => {
      stubRows(sampleRows);

      const promise = CoordinatesSnapshotService.invalidate();

      should(CoordinatesSnapshotService.load()).equal(promise);
      await promise;
      should(rowsStub.calledOnce).be.true();
    });

    describe('while a load is running', () => {
      const holdFirstLoad = () => {
        const first = deferred();
        rowsStub = sinon.stub(
          GeoLocService,
          'getAllPublicEntranceCriteriaRows'
        );
        rowsStub.onFirstCall().returns(first.promise);
        rowsStub.onSecondCall().resolves([...sampleRows, extraRow]);
        return first;
      };

      it('should run one follow-up load, after the running one, that sees the newer rows', async () => {
        const first = holdFirstLoad();
        const running = CoordinatesSnapshotService.load();

        const promises = [1, 2, 3].map(() =>
          CoordinatesSnapshotService.invalidate()
        );

        should(promises[1]).equal(promises[0]);
        should(promises[2]).equal(promises[0]);
        should(rowsStub.callCount).equal(1);

        first.resolve(sampleRows);
        await running;
        await promises[0];

        should(rowsStub.callCount).equal(2);
        should(world()).have.length(4);
      });

      it('should still run the follow-up load when the running one fails', async () => {
        sinon.stub(sails.log, 'error');
        const first = holdFirstLoad();
        const running = CoordinatesSnapshotService.load();
        const followUp = CoordinatesSnapshotService.invalidate();

        first.reject(new Error('DB down'));
        await running.should.be.rejected();
        await followUp;

        should(rowsStub.callCount).equal(2);
        should(world()).have.length(4);
      });

      it('should queue a new follow-up for an invalidate() made after the previous one started', async () => {
        const first = holdFirstLoad();
        CoordinatesSnapshotService.load();
        const followUp = CoordinatesSnapshotService.invalidate();
        first.resolve(sampleRows);
        await followUp;

        stubRows(sampleRows);
        await CoordinatesSnapshotService.invalidate();

        should(rowsStub.calledOnce).be.true();
        should(world()).have.length(3);
      });
    });
  });

  describe('ensureLoaded()', () => {
    it('should resolve true without querying when a snapshot is loaded', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();
      rowsStub.resetHistory();

      should(await CoordinatesSnapshotService.ensureLoaded()).be.true();
      should(rowsStub.callCount).equal(0);
    });

    it('should await the running load and resolve true when it succeeds', async () => {
      const pending = deferred();
      rowsStub = sinon
        .stub(GeoLocService, 'getAllPublicEntranceCriteriaRows')
        .returns(pending.promise);
      CoordinatesSnapshotService.load();

      const ensured = CoordinatesSnapshotService.ensureLoaded();
      pending.resolve(sampleRows);

      should(await ensured).be.true();
      should(rowsStub.calledOnce).be.true();
    });

    it('should start a load when none is running', async () => {
      stubRows(sampleRows);

      should(await CoordinatesSnapshotService.ensureLoaded()).be.true();
      should(rowsStub.calledOnce).be.true();
    });

    it('should resolve false, without rejecting, when the load fails', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure();

      should(await CoordinatesSnapshotService.ensureLoaded()).be.false();
    });

    it('should resolve false without querying within the retry delay of a failure', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure();
      await CoordinatesSnapshotService.ensureLoaded();
      rowsStub.resetHistory();

      should(await CoordinatesSnapshotService.ensureLoaded()).be.false();
      should(rowsStub.callCount).equal(0);
    });
  });

  describe('isWorldwide()', () => {
    it('should be true only when both axes cover their full range', () => {
      should(
        CoordinatesSnapshotService.isWorldwide(-90, -180, 90, 180)
      ).be.true();
      should(
        CoordinatesSnapshotService.isWorldwide(-95, -200, 95, 200)
      ).be.true();
      should(
        CoordinatesSnapshotService.isWorldwide(-89, -180, 90, 180)
      ).be.false();
      should(
        CoordinatesSnapshotService.isWorldwide(-90, -180, 90, 179)
      ).be.false();
    });
  });

  describe('reset()', () => {
    it('should clear the snapshot', async () => {
      stubRows(sampleRows);
      await CoordinatesSnapshotService.load();

      CoordinatesSnapshotService.reset();
      holdLoads();

      should(CoordinatesSnapshotService.isLoaded()).be.false();
      should(CoordinatesSnapshotService.getLastRefreshedAt()).be.null();
      should(CoordinatesSnapshotService.getWorldResponse()).be.null();
    });

    it('should clear the retry delay', async () => {
      sinon.stub(sails.log, 'error');
      stubFailure();
      await CoordinatesSnapshotService.ensureLoaded();

      CoordinatesSnapshotService.reset();
      stubRows(sampleRows);

      should(await CoordinatesSnapshotService.ensureLoaded()).be.true();
    });
  });
});
