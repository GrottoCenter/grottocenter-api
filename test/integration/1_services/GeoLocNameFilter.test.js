const should = require('should');
const sinon = require('sinon');
const GeoLocService = require('../../../api/services/GeoLocService');
const CommonService = require('../../../api/services/CommonService');

describe('GeoLocService - name join is_main filter fix', () => {
  // Bounding box covering fixture entrances (lat ~57-63, lng ~72-79)
  const southWestBound = { lat: 55, lng: 70 };
  const northEastBound = { lat: 65, lng: 80 };

  describe('getEntrancesMap() no row multiplication', () => {
    it('should return at most one row per entrance (no name duplication)', async () => {
      const entrances = await GeoLocService.getEntrancesMap(
        southWestBound,
        northEastBound,
        1000
      );
      should(entrances).be.an.Array();
      should(entrances.length).be.greaterThan(
        0,
        'No fixture entrances in bounding box — test is vacuous'
      );
      const ids = entrances.map((e) => e.id);
      const uniqueIds = [...new Set(ids)];
      should(ids.length).equal(
        uniqueIds.length,
        'Duplicate entrance IDs found — name join is causing row multiplication'
      );
    });
  });

  describe('getNetworksMap() no row multiplication', () => {
    it('should return at most one row per network (no name duplication)', async () => {
      // Networks require multiple entrances sharing the same cave.
      // Current fixtures have no multi-entrance caves, so this verifies
      // the query runs without error and returns no duplicates if any exist.
      const networks = await GeoLocService.getNetworksMap(
        southWestBound,
        northEastBound
      );
      should(networks).be.an.Array();
      if (networks.length > 0) {
        const ids = networks.map((n) => n.id);
        const uniqueIds = [...new Set(ids)];
        should(ids.length).equal(
          uniqueIds.length,
          'Duplicate network IDs found — name join is causing row multiplication'
        );
      }
    });
  });

  describe('SQL queries contain is_main filter', () => {
    it('should include is_main = true in entrance map query', async () => {
      const spy = sinon.spy(CommonService, 'query');
      try {
        await GeoLocService.getEntrancesMap(
          southWestBound,
          northEastBound,
          100
        );
        should(spy.called).be.true();
        const sql = spy.firstCall.args[0];
        should(sql).containEql('is_main = true');
        should(sql).containEql('is_deleted = false');
      } finally {
        spy.restore();
      }
    });
  });
});
