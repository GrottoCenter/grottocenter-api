const should = require('should');
const sinon = require('sinon');
// Required at load time, together: the module holds these copies, and the ones
// Sails re-requires when it lifts are different objects
const CommonService = require('../../../api/services/CommonService');
const SearchService = require('../../../api/services/SearchService');
const typesense = require('../../../config/typesense');
const { LOCK_KEY } = require('../../../api/dbSync/searchWriteLock');
const {
  reconcile,
  reconcileCollection,
  COLLECTIONS,
} = require('../../../api/dbSync/reconcile');

const lockHeld = async () => {
  const { rows } = await CommonService.query(
    `SELECT count(*)::int AS n FROM pg_locks
     WHERE locktype = 'advisory' AND objid = $1 AND granted`,
    [LOCK_KEY]
  );
  return rows[0].n === 1;
};

// Fixtures: devices 1, 2 (soft-deleted) and 3
describe('search reconciliation', () => {
  let syncStub;
  let exportStub;

  beforeEach(() => {
    syncStub = sinon.stub(SearchService, 'syncDocuments').resolves();
    exportStub = sinon.stub(typesense, 'exportIds').resolves([]);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('reconcileCollection()', () => {
    it('syncs every row of the table, one keyset page after the other', async () => {
      const result = await reconcileCollection('devices', { pageSize: 2 });

      // The soft-deleted device is synced too: syncDocuments removes it
      should(syncStub.args).eql([
        ['devices', [1, 2]],
        ['devices', [3]],
      ]);
      should(result).eql({ rows: 3, orphans: 0 });
    });

    it('builds and imports each page holding the search write lock', async () => {
      const held = [];
      syncStub.callsFake(async () => held.push(await lockHeld()));

      await reconcileCollection('devices', { pageSize: 2 });

      should(held).eql([true, true]);
      should(await lockHeld()).be.false();
    });

    it('checks again the indexed ids that have no row', async () => {
      exportStub.resolves([1, 424242, 3, 424243, 424244]);

      const result = await reconcileCollection('devices', { pageSize: 2 });

      should(exportStub.args).eql([['devices']]);
      should(syncStub.args.slice(2)).eql([
        ['devices', [424242, 424243]],
        ['devices', [424244]],
      ]);
      should(result).eql({ rows: 3, orphans: 3 });
    });

    it('stops before the next page once the signal is aborted', async () => {
      const controller = new AbortController();
      syncStub.callsFake(async () => controller.abort(new Error('expired')));

      await reconcileCollection('devices', {
        pageSize: 2,
        signal: controller.signal,
      }).should.be.rejectedWith('expired');

      should(syncStub.callCount).equal(1);
      should(exportStub.called).be.false();
    });

    it('throws when a sync fails', async () => {
      syncStub.rejects(new Error('Typesense unreachable'));
      await reconcileCollection('devices').should.be.rejectedWith(
        'Typesense unreachable'
      );
    });
  });

  describe('reconcile()', () => {
    it('reconciles every search collection', async () => {
      // The seven collections, whatever their order
      should([...COLLECTIONS].sort()).eql([
        'caves',
        'devices',
        'documents',
        'entrances',
        'massifs',
        'organizations',
        'persons',
      ]);

      await reconcile();

      should([...new Set(syncStub.args.map(([name]) => name))]).eql(
        COLLECTIONS
      );
      should(exportStub.args.map(([name]) => name)).eql(COLLECTIONS);
    });

    it('goes on with the other collections when one fails, then throws', async () => {
      syncStub.withArgs('caves').rejects(new Error('Typesense unreachable'));

      await reconcile().should.be.rejectedWith(
        'Search reconciliation failed for caves'
      );

      should(exportStub.args.map(([name]) => name)).eql(
        COLLECTIONS.filter((name) => name !== 'caves')
      );
    });

    it('stops at once when the signal is aborted', async () => {
      const controller = new AbortController();
      syncStub.callsFake(async () => controller.abort(new Error('expired')));

      await reconcile({ signal: controller.signal }).should.be.rejectedWith(
        'expired'
      );

      should(syncStub.callCount).equal(1);
    });
  });
});
