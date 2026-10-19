/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle */
const EventEmitter = require('events');
const should = require('should');
const sinon = require('sinon');
// The pg copy Waterline actually uses, wherever npm put it.
// eslint-disable-next-line import/no-dynamic-require
const { Pool } = require(
  require.resolve('pg', {
    paths: [require.resolve('machinepack-postgresql')],
  })
);
const guardPgPool = require('../../../api/utils/guardPgPool');
const logger = require('../../../api/utils/logger');

const { cancelLeasedQueries } = guardPgPool;

// Run `fn` in a request-like async context that tracks its leases.
const inRequest = (leases, fn) =>
  logger.run('test-trace', () => {
    logger.getStore().pgLeases = leases;
    return fn();
  });

const socketError = () =>
  Object.assign(new Error('read ETIMEDOUT'), {
    code: 'ETIMEDOUT',
    errno: -110,
    syscall: 'read',
  });

const fakePool = () =>
  Object.assign(new EventEmitter(), {
    options: {},
    connect: sinon.stub(),
    _clients: [],
    totalCount: 1,
    idleCount: 0,
    waitingCount: 0,
  });

describe('guardPgPool', () => {
  describe('with a fake pool', () => {
    let pool;
    let log;

    beforeEach(() => {
      pool = fakePool();
      log = { error: sinon.stub() };
    });

    it('turns on TCP keepalive for new connections', () => {
      guardPgPool(pool, log);
      should(pool.options.keepAlive).be.true();
      should(pool.options.keepAliveInitialDelayMillis).equal(60000);
    });

    it('logs instead of throwing when a connected client errors', () => {
      guardPgPool(pool, log);
      const client = new EventEmitter();
      pool.emit('connect', client);

      should(() => client.emit('error', socketError())).not.throw();
      sinon.assert.calledOnce(log.error);
      const details = log.error.firstCall.args[1];
      should(details).match({
        code: 'ETIMEDOUT',
        message: 'read ETIMEDOUT',
        leased: false,
        leasedForMs: null,
      });
    });

    it('reports whether the client was leased and for how long', () => {
      const clock = sinon.useFakeTimers({ now: 1000 });
      try {
        guardPgPool(pool, log);
        const client = new EventEmitter();
        pool.emit('connect', client);
        pool.emit('acquire', client);
        clock.tick(1500);

        client.emit('error', socketError());
        should(log.error.firstCall.args[1]).match({
          leased: true,
          leasedForMs: 1500,
        });

        pool.emit('release', undefined, client);
        client.emit('error', socketError());
        should(log.error.secondCall.args[1]).match({ leased: false });
      } finally {
        clock.restore();
      }
    });

    it('guards clients opened before it was installed', () => {
      const client = new EventEmitter();
      pool._clients.push(client);
      guardPgPool(pool, log);

      should(() => client.emit('error', socketError())).not.throw();
      sinon.assert.calledOnce(log.error);
    });

    it('turns on TCP keepalive for clients opened before it was installed', () => {
      const setKeepAlive = sinon.stub();
      const client = Object.assign(new EventEmitter(), {
        connection: { stream: { setKeepAlive } },
      });
      pool._clients.push(client);
      guardPgPool(pool, log);

      sinon.assert.calledOnceWithExactly(setKeepAlive, true, 60000);
    });

    describe('lease attribution (#1849)', () => {
      let client;
      // The pool's own connect, which the guard wraps.
      let rawConnect;

      beforeEach(() => {
        client = new EventEmitter();
        rawConnect = pool.connect;
        rawConnect.callsFake((cb) => {
          if (cb) return setImmediate(() => cb(undefined, client, () => {}));
          return Promise.resolve(client);
        });
        guardPgPool(pool, log);
      });

      it('records a callback lease in the calling request', async () => {
        const leases = new Set();
        await inRequest(
          leases,
          () =>
            new Promise((resolve) => {
              pool.connect(resolve);
            })
        );
        should([...leases]).eql([client]);
      });

      it('records a promise lease in the calling request', async () => {
        const leases = new Set();
        await inRequest(leases, () => pool.connect());
        should([...leases]).eql([client]);
      });

      it('forgets the lease on release', async () => {
        const leases = new Set();
        await inRequest(leases, () => pool.connect());
        pool.emit('release', undefined, client);
        should(leases.size).equal(0);
      });

      it('tracks nothing outside a request', async () => {
        should(await pool.connect()).equal(client);
        await logger.run('job-trace', () => pool.connect());
        pool.emit('release', undefined, client);
      });

      it('refuses any connection to an aborted request', async () => {
        const leases = new Set();
        await cancelLeasedQueries(leases, pool, log);

        await should(inRequest(leases, () => pool.connect())).be.rejectedWith({
          code: '57014',
        });
        const err = await inRequest(
          leases,
          () =>
            new Promise((resolve) => {
              pool.connect(resolve);
            })
        );
        should(err).match({ code: '57014' });
        sinon.assert.notCalled(rawConnect);
      });

      it('gives back a callback lease granted after the abort', async () => {
        const leases = new Set();
        const done = sinon.stub();
        let grant;
        rawConnect.callsFake((cb) => {
          grant = () => cb(undefined, client, done);
        });
        const acquired = inRequest(
          leases,
          () =>
            new Promise((resolve) => {
              pool.connect((err, granted) => resolve({ err, granted }));
            })
        );
        await cancelLeasedQueries(leases, pool, log);
        client.release = sinon.stub();
        grant();

        const { err, granted } = await acquired;
        should(err).match({ code: '57014' });
        should(granted).be.undefined();
        sinon.assert.calledOnce(client.release);
        should(leases.size).equal(0);
      });

      it('gives back a promise lease granted after the abort', async () => {
        const leases = new Set();
        let grant;
        rawConnect.callsFake(
          () =>
            new Promise((resolve) => {
              grant = () => resolve(client);
            })
        );
        const acquired = inRequest(leases, () => pool.connect());
        await cancelLeasedQueries(leases, pool, log);
        client.release = sinon.stub();
        grant();

        await should(acquired).be.rejectedWith({ code: '57014' });
        sinon.assert.calledOnce(client.release);
        should(leases.size).equal(0);
      });

      it('passes connection errors through', async () => {
        const leases = new Set();
        const failure = new Error('getConnection failed');
        const failing = fakePool();
        failing.connect.yieldsAsync(failure);
        guardPgPool(failing, log);
        const err = await inRequest(
          leases,
          () =>
            new Promise((resolve) => {
              failing.connect(resolve);
            })
        );
        should(err).equal(failure);
        should(leases.size).equal(0);
      });
    });

    it('is idempotent', () => {
      guardPgPool(pool, log);
      guardPgPool(pool, log);
      const client = new EventEmitter();
      pool.emit('connect', client);

      should(client.listenerCount('error')).equal(1);
      should(pool.listenerCount('connect')).equal(1);
    });
  });

  // Reproduces #1826 against the pg driver bundled with machinepack-postgresql:
  // a socket error on a checked-out connection.
  describe('with the Waterline pg driver', () => {
    let pool;

    beforeEach(() => {
      const { connectionString } = sails.getDatastore().manager;
      pool = new Pool({ connectionString, max: 1 });
      pool.on('error', () => {});
    });

    afterEach(() => pool.end());

    it('crashes on a leased client without the guard (control)', async () => {
      const client = await pool.connect();
      should(() => client.connection.emit('error', socketError())).throw(
        /ETIMEDOUT/
      );
      client.release(true);
    });

    it('keeps the process up and discards the broken client', async () => {
      const log = { error: sinon.stub() };
      guardPgPool(pool, log);

      const client = await pool.connect();
      should(client.connection._keepAlive).be.true();
      should(client.connection._keepAliveInitialDelayMillis).equal(60000);

      const pending = client.query('SELECT pg_sleep(5)');
      should(() => client.connection.emit('error', socketError())).not.throw();
      await should(pending).be.rejectedWith(/ETIMEDOUT/);

      sinon.assert.calledOnce(log.error);
      should(log.error.firstCall.args[1]).match({ leased: true });

      client.release();
      should(pool.totalCount).equal(0);

      // The pool still works afterwards.
      const { rows } = await pool.query('SELECT 1 AS ok');
      should(rows[0].ok).equal(1);
    });

    it('cancels the queries leased by a request (#1849)', async () => {
      const log = { error: sinon.stub(), warn: sinon.stub() };
      guardPgPool(pool, log);
      const leases = new Set();
      const client = await inRequest(leases, () => pool.connect());

      const startedAt = Date.now();
      const pending = client.query('SELECT pg_sleep(30)');
      should(await cancelLeasedQueries(leases, pool, log)).equal(1);
      await should(pending).be.rejectedWith({ code: '57014' });
      should(Date.now() - startedAt).be.below(5000);
      sinon.assert.notCalled(log.warn);

      // The connection is still usable and goes back to the pool.
      should((await client.query('SELECT 1 AS ok')).rows[0].ok).equal(1);
      client.release();
      should(leases.size).equal(0);
      should(pool.idleCount).equal(1);
    });

    it('skips a connection released before the cancel', async () => {
      const log = { error: sinon.stub(), warn: sinon.stub() };
      guardPgPool(pool, log);
      const leases = new Set();
      const client = await inRequest(leases, () => pool.connect());
      client.release();

      should(await cancelLeasedQueries(leases, pool, log)).equal(0);
    });

    it('never runs the query of a request aborted while queued', async () => {
      const log = { error: sinon.stub(), warn: sinon.stub() };
      guardPgPool(pool, log);
      // The pool's only connection is busy: the request has to wait for it.
      const busy = await pool.connect();
      const leases = new Set();
      const query = sinon.spy();
      const pending = inRequest(leases, async () => {
        const client = await pool.connect();
        query();
        return client.query('SELECT pg_sleep(30)');
      });
      should(pool.waitingCount).equal(1);

      should(await cancelLeasedQueries(leases, pool, log)).equal(0);
      busy.release();

      await should(pending).be.rejectedWith({ code: '57014' });
      sinon.assert.notCalled(query);
      should(leases.size).equal(0);
      should(pool.idleCount).equal(1);
    });

    it('skips a connection released while an earlier cancel is pending', async () => {
      const log = { error: sinon.stub(), warn: sinon.stub() };
      const wide = new Pool({
        connectionString: sails.getDatastore().manager.connectionString,
        max: 2,
      });
      wide.on('error', () => {});
      try {
        guardPgPool(wide, log);
        const leases = new Set();
        const first = await inRequest(leases, () => wide.connect());
        const second = await inRequest(leases, () => wide.connect());
        const slow = first.query('SELECT pg_sleep(30)');

        // Before the first cancel goes out, the second connection is
        // released and leased to another request, which starts a write.
        let otherQuery;
        let hooked = false;
        class Canceller extends wide.Client {
          query(...args) {
            if (hooked) return super.query(...args);
            hooked = true;
            second.release();
            return wide.connect().then((other) => {
              should(other).equal(second);
              otherQuery = other
                .query('SELECT pg_sleep(0.5), 1 AS ok')
                .finally(() => other.release());
              return super.query(...args);
            });
          }
        }

        should(
          await cancelLeasedQueries(
            leases,
            { Client: Canceller, options: wide.options },
            log
          )
        ).equal(1);
        await should(slow).be.rejectedWith({ code: '57014' });
        should((await otherQuery).rows[0].ok).equal(1);
        first.release();
      } finally {
        await wide.end();
      }
    });

    it('logs instead of throwing when the cancel cannot connect', async () => {
      const log = { error: sinon.stub(), warn: sinon.stub() };
      const leases = new Set([{ processID: 1 }]);
      const unreachable = {
        Client: pool.Client,
        options: { host: '127.0.0.1', port: 1, connectionTimeoutMillis: 1000 },
      };

      should(await cancelLeasedQueries(leases, unreachable, log)).equal(0);
      sinon.assert.calledOnce(log.warn);
    });
  });
});
