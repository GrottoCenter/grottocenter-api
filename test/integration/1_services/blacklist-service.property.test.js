/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const BlacklistService = require('../../../api/services/BlacklistService');
const CommonService = require('../../../api/services/CommonService');

// --- Shared arbitraries ---

// Caver IDs: positive integers in a realistic range
const caverIdArb = fc.integer({ min: 1, max: 100000 });

// Unix timestamp in seconds (realistic JWT iat range: 2020–2030)
const iatArb = fc.integer({ min: 1577836800, max: 1893456000 });

// A Date within a realistic range for revoked_before
const revokedBeforeDateArb = fc
  .integer({ min: 1577836800000, max: 1893456000000 })
  .map((ms) => new Date(ms));

// --- Shared setup/teardown ---

function setupBlacklistSuite() {
  beforeEach(() => {
    BlacklistService.getCache().clear();
  });

  afterEach(() => {
    BlacklistService.getCache().clear();
    sinon.restore();
  });
}

/**
 * Property 1: isRevoked comparison correctness
 *
 * For any caver ID, any iat (Unix timestamp in seconds), and any revoked_before
 * (Date), isRevoked(caverId, iat) returns true if and only if the cache contains
 * an entry for caverId and iat < revoked_before (in seconds). If the cache has
 * no entry for caverId, or if iat >= revoked_before, it returns false.
 *
 * Validates: Requirements 4.2, 4.3, 4.4, 6.2
 */
describe('BlacklistService - Property 1: isRevoked comparison correctness', () => {
  setupBlacklistSuite();

  it('should return false when cache has no entry for caverId', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(caverIdArb, iatArb, (caverId, iat) => {
        // Cache is empty — no entry for this caverId
        const result = BlacklistService.isRevoked(caverId, iat);
        should(result).be.false();
      }),
      { numRuns: 100 }
    );
  });

  it('should return true when iat < revoked_before', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        caverIdArb,
        revokedBeforeDateArb,
        (caverId, revokedBefore) => {
          const cache = BlacklistService.getCache();
          cache.set(caverId, revokedBefore);

          // iat strictly less than revoked_before (subtract at least 1 second)
          const revokedBeforeSec = Math.floor(revokedBefore.getTime() / 1000);
          const iat = revokedBeforeSec - 1;

          const result = BlacklistService.isRevoked(caverId, iat);
          should(result).be.true();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false when iat >= revoked_before', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        caverIdArb,
        revokedBeforeDateArb,
        fc.nat({ max: 10 }),
        (caverId, revokedBefore, offset) => {
          const cache = BlacklistService.getCache();
          cache.set(caverId, revokedBefore);

          // The comparison is iat < revokedBefore.getTime() / 1000.
          // To guarantee iat >= that value, ceil the seconds and optionally add offset.
          const revokedBeforeSec = Math.ceil(revokedBefore.getTime() / 1000);
          const iat = revokedBeforeSec + offset;

          const result = BlacklistService.isRevoked(caverId, iat);
          should(result).be.false();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Revoke-then-isRevoked round trip
 *
 * For any caver ID, after calling revoke(caverId), isRevoked(caverId, iat)
 * returns true for all iat values strictly less than the time at which revoke()
 * was called, and false for iat values greater than or equal to that time.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 6.1
 */
describe('BlacklistService - Property 2: Revoke-then-isRevoked round trip', () => {
  setupBlacklistSuite();

  it('should revoke tokens issued before revoke() and accept tokens issued after', async function () {
    this.timeout(60000);
    await fc.assert(
      fc.asyncProperty(caverIdArb, async (caverId) => {
        const beforeRevoke = Math.floor(Date.now() / 1000);
        await BlacklistService.revoke(caverId);
        const afterRevoke = Math.ceil(Date.now() / 1000);

        // iat well before revocation — should be revoked
        const oldIat = beforeRevoke - 3600;
        should(BlacklistService.isRevoked(caverId, oldIat)).be.true();

        // iat well after revocation — should NOT be revoked
        const futureIat = afterRevoke + 1;
        should(BlacklistService.isRevoked(caverId, futureIat)).be.false();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: UPSERT idempotence — one entry per user
 *
 * For any caver ID and any sequence of revoke() calls for that caver, the
 * blacklist cache contains exactly one entry for that caver, and its
 * revoked_before value is greater than or equal to the timestamp of the most
 * recent revoke() call.
 *
 * Validates: Requirements 1.3, 2.4, 3.4
 */
describe('BlacklistService - Property 3: UPSERT idempotence', () => {
  setupBlacklistSuite();

  it('should maintain exactly one cache entry per user after multiple revoke() calls', async function () {
    this.timeout(60000);
    await fc.assert(
      fc.asyncProperty(
        caverIdArb,
        fc.integer({ min: 1, max: 5 }),
        async (caverId, callCount) => {
          let lastCallTime;
          for (let i = 0; i < callCount; i += 1) {
            lastCallTime = Math.floor(Date.now() / 1000);
            // eslint-disable-next-line no-await-in-loop
            await BlacklistService.revoke(caverId);
          }

          const cache = BlacklistService.getCache();
          // Exactly one entry for this caverId
          should(cache.has(caverId)).be.true();

          // The stored timestamp should be >= the time of the last call
          const stored = cache.get(caverId);
          const storedSec = Math.floor(stored.getTime() / 1000);
          should(storedSec).be.aboveOrEqual(lastCallTime);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: loadCache round trip — DB and cache agreement
 *
 * For any set of blacklist rows in the database, after calling loadCache(),
 * the in-memory cache contains exactly the same set of (caverId, revoked_before)
 * pairs as the database table, with no extra or missing entries.
 *
 * Validates: Requirements 2.2, 2.3, 6.3, 6.4
 */
describe('BlacklistService - Property 4: loadCache round trip', () => {
  setupBlacklistSuite();

  it('should populate cache to match DB rows exactly after loadCache()', async function () {
    this.timeout(60000);

    // Use a small set of known caver IDs from fixtures to satisfy FK constraint
    const fixturedCaverIdArb = fc.constantFrom(1, 2, 3, 4, 5);
    const timestampArb = fc
      .integer({ min: 1577836800000, max: 1893456000000 })
      .map((ms) => new Date(ms));

    // Generate unique (caverId, revokedBefore) pairs
    const rowsArb = fc.uniqueArray(
      fc.record({
        caverId: fixturedCaverIdArb,
        revokedBefore: timestampArb,
      }),
      { minLength: 0, maxLength: 5, selector: (r) => r.caverId }
    );

    await fc.assert(
      fc.asyncProperty(rowsArb, async (rows) => {
        // Clean the table
        await CommonService.query('DELETE FROM t_token_blacklist');

        // Insert rows via raw SQL
        for (const row of rows) {
          // eslint-disable-next-line no-await-in-loop
          await CommonService.query(
            'INSERT INTO t_token_blacklist (id_caver, revoked_before) VALUES ($1, $2)',
            [row.caverId, row.revokedBefore.toISOString()]
          );
        }

        // Load cache from DB
        await BlacklistService.loadCache();

        const cache = BlacklistService.getCache();

        // Cache size must match row count
        should(cache.size).equal(rows.length);

        // Each row must be in the cache with matching timestamp
        rows.forEach((row) => {
          should(cache.has(row.caverId)).be.true();
          const cached = cache.get(row.caverId);
          should(cached.getTime()).equal(row.revokedBefore.getTime());
        });
      }),
      { numRuns: 100 }
    );

    // Clean up
    await CommonService.query('DELETE FROM t_token_blacklist');
  });
});

/**
 * Property 5: Revoke failure atomicity
 *
 * For any cache state, if revoke(caverId) throws an error (due to a database
 * write failure), the in-memory cache is identical to its state before the
 * revoke() call — no entry is added or modified.
 *
 * Validates: Requirements 6.5
 */
describe('BlacklistService - Property 5: Revoke failure atomicity', () => {
  setupBlacklistSuite();

  it('should leave cache unchanged when revoke() fails due to DB error', async function () {
    this.timeout(60000);
    await fc.assert(
      fc.asyncProperty(
        caverIdArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (caverId, errorMsg) => {
          const cache = BlacklistService.getCache();

          // Snapshot the cache state before the failed revoke
          const snapshotEntries = [...cache.entries()].map(([k, v]) => [
            k,
            v.getTime(),
          ]);

          // Stub the global CommonService (Sails global) used by BlacklistService
          const queryStub = sinon
            .stub(sails, 'sendNativeQuery')
            .rejects(new Error(errorMsg));

          let threw = false;
          try {
            await BlacklistService.revoke(caverId);
          } catch (e) {
            threw = true;
          }

          queryStub.restore();

          // revoke() must have thrown
          should(threw).be.true();

          // Cache must be identical to the snapshot
          const afterEntries = [...cache.entries()].map(([k, v]) => [
            k,
            v.getTime(),
          ]);
          should(afterEntries).deepEqual(snapshotEntries);
        }
      ),
      { numRuns: 100 }
    );
  });
});
