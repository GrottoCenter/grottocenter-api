const should = require('should');
const fc = require('fast-check');
const { shardKey, SHARD_SIZE } = require('../../../api/utils/botSitemap');

const MAX_ID = 2147483647;
const type = fc.constantFrom('cave', 'massif', 'organization');
const id = fc.oneof(
  fc.integer({ min: 1, max: MAX_ID }),
  // Around the edges of a range, where an off-by-one shows
  fc
    .tuple(fc.integer({ min: 0, max: 42948 }), fc.integer({ min: -2, max: 2 }))
    .map(([k, delta]) => k * 50000 + delta)
    .filter((n) => n >= 1 && n <= MAX_ID)
);

describe('botSitemap.shardKey - Property: fixed id ranges', () => {
  it('is deterministic: the same type and id always give the same shard', () => {
    fc.assert(
      fc.property(type, id, (t, n) => {
        should(shardKey(t, n)).equal(shardKey(t, n));
      }),
      { numRuns: 200 }
    );
  });

  it('puts an id in the range [k*50000, (k+1)*50000) of its shard k', () => {
    fc.assert(
      fc.property(type, id, (t, n) => {
        const k = shardKey(t, n);
        should(Number.isInteger(k)).be.true();
        should(k * 50000).be.belowOrEqual(n);
        should(n).be.below((k + 1) * 50000);
      }),
      { numRuns: 500 }
    );
  });

  it('never puts two ids 50,000 or more apart in the same shard', () => {
    fc.assert(
      fc.property(type, id, id, (t, a, b) => {
        if (shardKey(t, a) === shardKey(t, b)) {
          should(Math.abs(a - b)).be.below(SHARD_SIZE);
        }
      }),
      { numRuns: 500 }
    );
  });

  it('is monotonic in the id, and moves by one shard at a range boundary', () => {
    fc.assert(
      // Pairs close enough to share or neighbour a shard, where a wrong order shows
      fc.property(type, id, fc.integer({ min: 0, max: 200000 }), (t, a, d) => {
        const b = Math.min(a + d, MAX_ID);
        should(shardKey(t, a)).be.belowOrEqual(shardKey(t, b));
        if (a < MAX_ID) {
          should(shardKey(t, a + 1) - shardKey(t, a)).equal(
            (a + 1) % 50000 === 0 ? 1 : 0
          );
        }
      }),
      { numRuns: 500 }
    );
  });

  it('does not depend on the type: each type has its own files', () => {
    fc.assert(
      fc.property(id, (n) => {
        should(shardKey('massif', n)).equal(shardKey('cave', n));
        should(shardKey('organization', n)).equal(shardKey('cave', n));
      }),
      { numRuns: 200 }
    );
  });

  it('refuses an id that is not a page id', () => {
    fc.assert(
      fc.property(
        type,
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.maxSafeNat().filter((n) => n > MAX_ID),
          fc.double().filter((x) => !Number.isInteger(x)),
          fc.constantFrom(NaN, Infinity, null, undefined, '1')
        ),
        (t, bad) => {
          should(() => shardKey(t, bad)).throw(RangeError);
        }
      ),
      { numRuns: 200 }
    );
  });
});
