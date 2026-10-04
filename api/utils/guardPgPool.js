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
 * setting it there reaches each new connection. The delay is kept under the
 * 4 minute idle timeout after which Azure drops a flow without notice.
 */

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
  pool.on('release', (err, client) => leasedAt.delete(client));

  // Clients opened before the guard was installed.
  // eslint-disable-next-line no-underscore-dangle
  (pool._clients || []).forEach(attach);
};

module.exports = guardPgPool;
