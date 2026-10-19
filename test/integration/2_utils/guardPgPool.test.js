/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle */
const EventEmitter = require('events');
const net = require('net');
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

// A pooled client as far as the guard is concerned.
const fakeClient = (props = {}) =>
  Object.assign(new EventEmitter(), { query: () => {} }, props);

// A server that accepts connections and then stalls: right away, or once the
// Postgres startup is done (AuthenticationOk + ReadyForQuery), on the first
// query.
const stallingServer = async ({ afterStartup }) => {
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    // Read, so that the client closing its end is seen.
    socket.resume();
    if (!afterStartup) return;
    socket.once('data', () => {
      const authOk = Buffer.from([0x52, 0, 0, 0, 8, 0, 0, 0, 0]);
      const ready = Buffer.from([0x5a, 0, 0, 0, 5, 0x49]);
      socket.write(Buffer.concat([authOk, ready]));
    });
  });
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    options: { host: '127.0.0.1', port: server.address().port, user: 'x' },
    sockets,
    close: () => {
      sockets.forEach((socket) => socket.destroy());
      return new Promise((resolve) => {
        server.close(resolve);
      });
    },
  };
};

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
      const client = fakeClient();
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
        const client = fakeClient();
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
      const client = fakeClient();
      pool._clients.push(client);
      guardPgPool(pool, log);

      should(() => client.emit('error', socketError())).not.throw();
      sinon.assert.calledOnce(log.error);
    });

    it('turns on TCP keepalive for clients opened before it was installed', () => {
      const setKeepAlive = sinon.stub();
      const client = fakeClient({
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
        client = fakeClient();
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

      // Sails' loader clears the require cache: config/http.js may hold
      // another copy of the module than the one that installed the guard.
      it('refuses a connection when another copy of the module marked the abort', async () => {
        const path = require.resolve('../../../api/utils/guardPgPool');
        const cached = require.cache[path];
        delete require.cache[path];
        try {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          const otherCopy = require(path);
          should(otherCopy).not.equal(guardPgPool);
          const leases = new Set();
          await otherCopy.cancelLeasedQueries(leases, pool, log);

          await should(inRequest(leases, () => pool.connect())).be.rejectedWith(
            { code: '57014' }
          );
        } finally {
          require.cache[path] = cached;
        }
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
      const client = fakeClient();
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

    // Node runs a socket's callbacks in the context the socket was opened in.
    it('credits a query callback to its caller, not to the request that opened the connection', async () => {
      guardPgPool(pool, { error: sinon.stub() });
      const opener = new Set();
      (await inRequest(opener, () => pool.connect())).release();
      await cancelLeasedQueries(opener, pool, {});

      const caller = new Set();
      const next = await inRequest(
        caller,
        () =>
          new Promise((resolve, reject) => {
            pool.connect((err, client) => {
              if (err) return reject(err);
              return client.query('SELECT 1', (queryErr) => {
                client.release();
                if (queryErr) return reject(queryErr);
                return pool.connect((nextErr, nextClient) =>
                  nextErr ? reject(nextErr) : resolve(nextClient)
                );
              });
            });
          })
      );
      should([...caller]).eql([next]);
      next.release();
    });

    it('credits a connection handed over on release to its waiter', async () => {
      guardPgPool(pool, { error: sinon.stub() });
      const holder = new Set();
      const held = await inRequest(holder, () => pool.connect());

      const waiter = new Set();
      const granted = inRequest(
        waiter,
        () =>
          new Promise((resolve, reject) => {
            pool.connect((err, client) => {
              if (err) return reject(err);
              return resolve({ client, store: logger.getStore() });
            });
          })
      );
      inRequest(holder, () => held.release());

      const { client, store } = await granted;
      should(store.pgLeases).equal(waiter);
      should([...waiter]).eql([client]);
      client.release();
    });

    [
      ['while connecting', false],
      ['while cancelling', true],
    ].forEach(([when, afterStartup]) => {
      it(`gives up on a server that stalls ${when}`, async () => {
        const server = await stallingServer({ afterStartup });
        try {
          const log = { warn: sinon.stub() };
          const leases = new Set([{ processID: 1 }]);
          const startedAt = Date.now();

          should(
            await cancelLeasedQueries(
              leases,
              { Client: pool.Client, options: server.options },
              log,
              { timeoutMs: 200 }
            )
          ).equal(0);
          should(Date.now() - startedAt).be.below(2000);
          sinon.assert.calledOnce(log.warn);
          // The stalled connection is dropped, not left open.
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
          should(server.sockets.size).equal(0);
        } finally {
          await server.close();
        }
      });
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
