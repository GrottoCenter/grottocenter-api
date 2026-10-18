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
 * `pgLeases` Set are tracked; background jobs never are.
 */

const { getStore } = require('./logger');

const KEEP_ALIVE_INITIAL_DELAY_MS = 60 * 1000;

const guardedPools = new WeakSet();

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
  pool.connect = (cb) => {
    const leases = getStore()?.pgLeases;
    if (!leases) return connect(cb);

    const track = (client) => {
      leaseOwner.set(client, leases);
      leases.add(client);
    };
    if (cb) {
      return connect((err, client, done) => {
        if (!err) track(client);
        cb(err, client, done);
      });
    }
    return connect().then((client) => {
      track(client);
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
 * Cancel whatever the connections in `leases` are running, with
 * `pg_cancel_backend()` sent on a dedicated connection: the pool itself may be
 * exhausted, which is precisely when cancelling matters (#1784). Postgres
 * answers the cancelled query with `57014 query_canceled`, rolls back its
 * transaction if any, and the connection goes back to the pool as usual.
 *
 * A connection released in the meantime is skipped. The check happens just
 * before the cancel is sent; a connection released and leased again within
 * that last round trip would be hit, a window accepted as negligible.
 *
 * Never throws; resolves to the number of backends signalled.
 */
const cancelLeasedQueries = async (leases, pool, log) => {
  if (!leases || leases.size === 0) return 0;

  const canceller = new pool.Client(pool.options);
  canceller.on('error', () => {});
  try {
    await canceller.connect();
    const pids = [...leases]
      .map((client) => client.processID)
      .filter((pid) => pid);
    await Promise.all(
      pids.map((pid) => canceller.query('SELECT pg_cancel_backend($1)', [pid]))
    );
    return pids.length;
  } catch (err) {
    log.warn('[pgPoolGuard] Could not cancel an aborted request', {
      code: err && err.code,
      message: err && err.message,
    });
    return 0;
  } finally {
    canceller.end().catch(() => {});
  }
};

module.exports = guardPgPool;
module.exports.cancelLeasedQueries = cancelLeasedQueries;
