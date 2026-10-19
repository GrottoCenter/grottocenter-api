/**
 * guardPgPool.js
 *
 * Keep an 'error' listener on every connection of the Waterline pg pool, for
 * the whole life of the connection (#1826).
 *
 * machinepack-postgresql only binds pool.on('error'), which pg-pool relays for
 * *idle* clients. When a client is checked out, pg-pool removes its idle
 * listener (pg-pool/index.js `_acquireClient`) and puts it back on release, so
 * a leased client has no 'error' listener at all. If its socket dies mid-lease
 * (e.g. `read ETIMEDOUT` after Azure silently drops the flow), pg emits
 * 'error' on the client, nothing listens, and Node kills the process. This is
 * intended node-postgres behavior (brianc/node-postgres#3202): a leased client
 * is the caller's responsibility.
 *
 * With a permanent listener the failure stays local: pg rejects the client's
 * pending queries (so the caller gets an error as usual), and pg-pool discards
 * the client on release because it is no longer queryable.
 *
 * It also turns on TCP keepalive. machinepack-postgresql's `meta` whitelist
 * drops `keepAlive`, but pg-pool builds every client from `pool.options`, so
 * setting it there reaches each new connection; connections opened before the
 * guard get it set on their socket directly. The delay is kept under the
 * 4 minute idle timeout after which Azure drops a flow without notice.
 *
 * Finally, it attributes each lease to the request that asked for it (#1849),
 * so that a request whose client went away can have its queries cancelled
 * (see `cancelLeasedQueries`). The owner is read from the async context when
 * `pool.connect` is *called*: pg-pool's 'acquire' event may fire from another
 * request's release, in that request's context. Only contexts that carry a
 * `pgLeases` Set are tracked; background jobs never are. Once a request is
 * aborted, it gets no connection any more, including one it was already
 * queued for when its client went away.
 *
 * That attribution needs every pg callback to run in its caller's context.
 * Node runs a socket's callbacks in the context the socket was opened in, so
 * without help a query callback runs in the context of whichever request
 * opened that pooled connection, and Waterline's next `pool.connect` from it
 * is credited to that request. The guard therefore binds the callbacks of
 * `pool.connect` and `client.query` to the context they were passed in.
 */

const { AsyncResource } = require('async_hooks');
const { getStore } = require('./logger');

const KEEP_ALIVE_INITIAL_DELAY_MS = 60 * 1000;

const guardedPools = new WeakSet();

// The `pgLeases` Sets of the requests whose client went away. Kept on global,
// like the logger's AsyncLocalStorage: Sails' loader clears the require cache,
// so the copy of this module that marks an abort (config/http.js) may not be
// the one that installed the guard.
if (!global.grottoAbortedPgRequests) {
  global.grottoAbortedPgRequests = new WeakSet();
}
const abortedRequests = global.grottoAbortedPgRequests;

// Fails the acquisition like the cancelled query it would have run.
const abortedError = () =>
  Object.assign(new Error('canceling statement: client aborted the request'), {
    code: '57014',
  });

const guardPgPool = (pool, log) => {
  if (guardedPools.has(pool)) return;
  guardedPools.add(pool);

  /* eslint-disable no-param-reassign */
  pool.options.keepAlive = true;
  pool.options.keepAliveInitialDelayMillis = KEEP_ALIVE_INITIAL_DELAY_MS;
  /* eslint-enable no-param-reassign */

  const guardedClients = new WeakSet();
  const leasedAt = new WeakMap();
  const leaseOwner = new WeakMap();

  const attach = (client) => {
    if (guardedClients.has(client)) return;
    guardedClients.add(client);

    // Only the trailing-callback form is rebound: it is the one
    // machinepack-postgresql uses. A promise continuation already runs in
    // the context of its `then`.
    const query = client.query.bind(client);
    // eslint-disable-next-line no-param-reassign
    client.query = (...args) => {
      const last = args.length - 1;
      if (typeof args[last] === 'function') {
        // eslint-disable-next-line no-param-reassign
        args[last] = AsyncResource.bind(args[last]);
      }
      return query(...args);
    };

    client.on('error', (err) => {
      const since = leasedAt.get(client);
      log.error('[pgPoolGuard] Error on pooled Postgres connection', {
        code: err && err.code,
        message: err && err.message,
        leased: since !== undefined,
        leasedForMs: since !== undefined ? Date.now() - since : null,
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
      });
    });
  };

  pool.on('connect', attach);
  pool.on('acquire', (client) => leasedAt.set(client, Date.now()));
  pool.on('release', (err, client) => {
    leasedAt.delete(client);
    const owner = leaseOwner.get(client);
    if (owner) owner.delete(client);
    leaseOwner.delete(client);
  });

  const connect = pool.connect.bind(pool);
  // eslint-disable-next-line no-param-reassign
  pool.connect = (callback) => {
    // pg-pool may hand a released connection to a waiter from the releasing
    // request's context.
    const cb = callback && AsyncResource.bind(callback);
    const leases = getStore()?.pgLeases;
    if (!leases) return connect(cb);

    if (abortedRequests.has(leases)) {
      if (cb) return process.nextTick(cb, abortedError());
      return Promise.reject(abortedError());
    }

    // Returns false, and gives the client back, when the request was aborted
    // while it waited for a connection.
    const track = (client) => {
      if (abortedRequests.has(leases)) {
        client.release();
        return false;
      }
      leaseOwner.set(client, leases);
      leases.add(client);
      return true;
    };
    if (cb) {
      return connect((err, client, done) => {
        if (err) return cb(err, client, done);
        if (!track(client)) return cb(abortedError());
        return cb(err, client, done);
      });
    }
    return connect().then((client) => {
      if (!track(client)) throw abortedError();
      return client;
    });
  };

  // Clients opened before the guard was installed missed both the 'connect'
  // event and the keepalive options. A TLS stream forwards setKeepAlive to
  // its TCP socket.
  // eslint-disable-next-line no-underscore-dangle
  (pool._clients || []).forEach((client) => {
    attach(client);
    const stream = client.connection && client.connection.stream;
    if (stream && typeof stream.setKeepAlive === 'function') {
      stream.setKeepAlive(true, KEEP_ALIVE_INITIAL_DELAY_MS);
    }
  });
};

/**
 * Mark the request owning `leases` as aborted, so that it gets no further
 * connection, and cancel whatever the connections it holds are running, with
 * `pg_cancel_backend()` sent on a dedicated connection: the pool itself may be
 * exhausted, which is precisely when cancelling matters (#1784). Postgres
 * answers the cancelled query with `57014 query_canceled`, rolls back its
 * transaction if any, and the connection goes back to the pool as usual.
 *
 * The cancels are sent one at a time, and a connection released in the
 * meantime is skipped: it may already serve another request. The check
 * happens just before each cancel is sent; a connection released and leased
 * again within that last round trip would be hit, a window accepted as
 * negligible.
 *
 * Never throws; resolves to the number of backends signalled.
 */
const cancelLeasedQueries = async (leases, pool, log) => {
  if (!leases) return 0;
  abortedRequests.add(leases);
  if (leases.size === 0) return 0;

  const canceller = new pool.Client(pool.options);
  canceller.on('error', () => {});
  let signalled = 0;
  try {
    await canceller.connect();
    // A snapshot: releases delete from `leases` while we iterate.
    for (const client of [...leases]) {
      if (leases.has(client) && client.processID) {
        // eslint-disable-next-line no-await-in-loop
        await canceller.query('SELECT pg_cancel_backend($1)', [
          client.processID,
        ]);
        signalled += 1;
      }
    }
    return signalled;
  } catch (err) {
    log.warn('[pgPoolGuard] Could not cancel an aborted request', {
      code: err && err.code,
      message: err && err.message,
    });
    return signalled;
  } finally {
    canceller.end().catch(() => {});
  }
};

module.exports = guardPgPool;
module.exports.cancelLeasedQueries = cancelLeasedQueries;
