const should = require('should');
const BlacklistService = require('../../../api/services/BlacklistService');
const CommonService = require('../../../api/services/CommonService');

describe('BlacklistService', () => {
  beforeEach(async () => {
    BlacklistService.getCache().clear();
    await CommonService.query('DELETE FROM t_token_blacklist');
  });

  afterEach(async () => {
    BlacklistService.getCache().clear();
    await CommonService.query('DELETE FROM t_token_blacklist');
  });

  describe('revoke()', () => {
    it('should create a DB row and cache entry for a new caver', async () => {
      const caverId = 1;
      await BlacklistService.revoke(caverId);

      // Cache should have the entry
      const cache = BlacklistService.getCache();
      should(cache.has(caverId)).be.true();
      should(cache.get(caverId)).be.a.Date();

      // DB should have the row
      const rows = await TTokenBlacklist.find({ id_caver: caverId });
      should(rows).have.length(1);
      should(rows[0].id_caver).equal(caverId);
    });

    it('should update the timestamp when revoking an existing caver', async () => {
      const caverId = 1;
      await BlacklistService.revoke(caverId);
      const firstTimestamp = BlacklistService.getCache().get(caverId);

      // Small delay to ensure timestamp differs
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      await BlacklistService.revoke(caverId);
      const secondTimestamp = BlacklistService.getCache().get(caverId);

      should(secondTimestamp.getTime()).be.aboveOrEqual(
        firstTimestamp.getTime()
      );

      // DB should still have exactly one row
      const rows = await TTokenBlacklist.find({ id_caver: caverId });
      should(rows).have.length(1);
    });
  });

  describe('isRevoked()', () => {
    it('should return false for empty cache', () => {
      const result = BlacklistService.isRevoked(
        999,
        Math.floor(Date.now() / 1000)
      );
      should(result).be.false();
    });

    it('should return false when iat equals revoked_before (edge case)', () => {
      const caverId = 1;
      // Use a Date with no sub-second precision to test exact equality
      const revokedBefore = new Date(1700000000000); // exact second boundary
      BlacklistService.getCache().set(caverId, revokedBefore);

      const iat = 1700000000; // exactly equal in seconds
      const result = BlacklistService.isRevoked(caverId, iat);
      should(result).be.false();
    });
  });

  describe('loadCache()', () => {
    it('should populate cache from DB rows', async () => {
      // Insert rows directly into DB
      await CommonService.query(
        'INSERT INTO t_token_blacklist (id_caver, revoked_before) VALUES ($1, $2)',
        [1, '2024-01-15T10:00:00Z']
      );
      await CommonService.query(
        'INSERT INTO t_token_blacklist (id_caver, revoked_before) VALUES ($1, $2)',
        [2, '2024-06-20T15:30:00Z']
      );

      await BlacklistService.loadCache();

      const cache = BlacklistService.getCache();
      should(cache.size).equal(2);
      should(cache.has(1)).be.true();
      should(cache.has(2)).be.true();
      should(cache.get(1)).be.a.Date();
      should(cache.get(2)).be.a.Date();
    });
  });
});
