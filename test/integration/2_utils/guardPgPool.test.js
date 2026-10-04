/* eslint-disable import/no-extraneous-dependencies, no-underscore-dangle */
const EventEmitter = require('events');
const should = require('should');
const sinon = require('sinon');
const { Pool } = require('machinepack-postgresql/node_modules/pg');
const guardPgPool = require('../../../api/utils/guardPgPool');

const socketError = () =>
  Object.assign(new Error('read ETIMEDOUT'), {
    code: 'ETIMEDOUT',
    errno: -110,
    syscall: 'read',
  });

const fakePool = () =>
  Object.assign(new EventEmitter(), {
    options: {},
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
  });
});
