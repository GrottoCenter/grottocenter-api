const should = require('should');
// Required at load time, together with the module under test: the copies
// Sails re-requires when it lifts are different objects
const CommonService = require('../../../api/services/CommonService');
const {
  withSearchWriteLock,
  LOCK_KEY,
} = require('../../../api/dbSync/searchWriteLock');

const lockHeld = async () => {
  const { rows } = await CommonService.query(
    `SELECT count(*)::int AS n FROM pg_locks
     WHERE locktype = 'advisory' AND objid = $1 AND granted`,
    [LOCK_KEY]
  );
  return rows[0].n === 1;
};

// Hold the lock until release() is called
const holdLock = async () => {
  let release;
  let acquired;
  const isAcquired = new Promise((resolve) => {
    acquired = resolve;
  });
  const done = withSearchWriteLock(
    () =>
      new Promise((resolve) => {
        release = resolve;
        acquired();
      })
  );
  await isAcquired;
  return {
    release: async () => {
      release();
      await done;
    },
  };
};

describe('searchWriteLock', () => {
  it('runs the function holding the lock, then releases it', async () => {
    const result = await withSearchWriteLock(async () => {
      should(await lockHeld()).be.true();
      return 'done';
    });

    should(result).equal('done');
    should(await lockHeld()).be.false();
  });

  it('releases the lock when the function throws', async () => {
    await withSearchWriteLock(async () => {
      throw new Error('sync failed');
    }).should.be.rejectedWith('sync failed');

    should(await lockHeld()).be.false();
  });

  it('gives up after its timeout while another holder has the lock', async () => {
    const holder = await holdLock();
    let called = false;
    try {
      await withSearchWriteLock(
        async () => {
          called = true;
        },
        { timeoutMs: 100 }
      ).should.be.rejectedWith({ code: 'E_SEARCH_LOCK_TIMEOUT' });
    } finally {
      await holder.release();
    }
    should(called).be.false();
  });

  it('waits for the holder without a timeout', async () => {
    const holder = await holdLock();
    const order = [];
    const waiting = withSearchWriteLock(async () => order.push('waiter'));
    // Give the waiter time to queue on the lock
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    order.push('holder done');
    await holder.release();
    await waiting;

    should(order).eql(['holder done', 'waiter']);
  });
});
