const util = require('util');
const should = require('should');
const sinon = require('sinon');
const logger = require('../../../api/utils/logger');

const SECRET = 'Tr0ub4dor-3-correct-horse-battery';

// How Waterline reports a cancelled query: the driver's error is nested.
const cancelledQueryError = () => {
  const driverError = Object.assign(
    new Error('canceling statement due to user request'),
    { code: '57014' }
  );
  return Object.assign(new Error('Query failed'), {
    name: 'OperationalError',
    cause: Object.assign(new Error('Query failed'), {
      raw: { error: driverError },
    }),
    raw: { error: driverError },
  });
};

// Runs `fn` in the context of a request whose queries were cancelled because
// its client went away (#1849).
const inAbortedRequest = (fn) =>
  logger.run('test-abort-1849', () => {
    logger.getStore().cancelledOnAbort = true;
    return fn();
  });

describe('Logger utility', () => {
  describe('getTraceId', () => {
    it('should return "no-trace" when no trace context exists', () => {
      const traceId = logger.getTraceId();
      should(traceId).equal('no-trace');
    });

    it('should return the trace ID when running in context', (done) => {
      logger.run('test-trace-123', () => {
        const traceId = logger.getTraceId();
        should(traceId).equal('test-trace-123');
        done();
      });
    });
  });

  describe('patched sails.log', () => {
    it('should include trace ID in logs', (done) => {
      logger.run('test-456', () => {
        const traceId = logger.getTraceId();
        should(traceId).equal('test-456');
        done();
      });
    });
  });

  // patchSailsLog() is never called in the test environment -- both
  // test/bootstrap.test.js and test/seed-database.js override `bootstrap` -- so
  // it has to be applied explicitly here. It is not idempotent (a second call
  // would prefix the trace ID twice), hence the restore in afterEach.
  describe('patchSailsLog redaction', () => {
    let collected;
    let stubs;

    beforeEach(() => {
      collected = [];
      const collect =
        () =>
        (...args) => {
          // Mirror how captains-log flattens its arguments: errors render from
          // their stack, everything else is inspected.
          collected.push(
            args
              .map((arg) =>
                typeof arg === 'string' ? arg : util.inspect(arg, { depth: 10 })
              )
              .join(' ')
          );
        };

      // Stubbed first so patchSailsLog captures the collectors as the
      // "original" methods it delegates to.
      stubs = ['info', 'error', 'warn', 'debug', 'verbose'].map((level) =>
        sinon.stub(sails.log, level).callsFake(collect())
      );
      logger.patchSailsLog();
    });

    afterEach(() => {
      // Puts the real methods back, discarding the patch wrapper with them.
      stubs.forEach((stub) => stub.restore());
    });

    it('should redact a logged adapter error', () => {
      const meta = {
        adapter: 'sails-postgresql',
        user: 'grottoce',
        password: SECRET,
        url: `postgres://grottoce:${SECRET}@db.example.org:5432/grottoce`,
      };
      const error = new Error(
        `Could not connect: ${util.inspect({ meta }, { depth: 5 })}`
      );
      error.name = 'AdapterError';
      error.meta = meta;
      error.cause = Object.assign(new Error('connect ECONNREFUSED'), { meta });

      sails.log.error('Sending 500 ("serverError") response: \n', error);

      should(collected).have.length(1);
      should(collected[0]).not.containEql(SECRET);
      should(collected[0]).containEql('AdapterError');
      should(collected[0]).containEql('[REDACTED datastore config]');
    });

    it('should redact a secret embedded in a logged string', () => {
      sails.log.warn(`connection failed for password: '${SECRET}'`);

      should(collected[0]).not.containEql(SECRET);
    });

    it('should still prefix the trace ID and keep ordinary lines intact', (done) => {
      logger.run('test-redaction-789', () => {
        sails.log.info('Res ::', 'GET', '/api/v1/entrances', 200, '12ms');

        should(collected[0]).equal(
          '[test-redaction-789] Res :: GET /api/v1/entrances 200 12ms'
        );
        done();
      });
    });

    describe('after a client abort (#1849)', () => {
      it('should log the cancelled query error as a warning', () => {
        const [, error, warn] = stubs;
        inAbortedRequest(() =>
          sails.log.error(
            'Sending 500 ("Server Error") response: \n',
            cancelledQueryError()
          )
        );

        sinon.assert.notCalled(error);
        sinon.assert.calledOnce(warn);
        should(collected[0]).startWith(
          '[test-abort-1849] (after client abort) Sending 500'
        );
      });

      it('should keep an unrelated error as an error', () => {
        const [, error, warn] = stubs;
        inAbortedRequest(() =>
          sails.log.error(
            '[pgPoolGuard] Error on pooled Postgres connection',
            Object.assign(new Error('read ETIMEDOUT'), { code: 'ETIMEDOUT' })
          )
        );

        sinon.assert.calledOnce(error);
        sinon.assert.notCalled(warn);
      });

      it('should keep a cancelled query as an error outside an aborted request', (done) => {
        const [, error, warn] = stubs;
        logger.run('test-no-abort', () => {
          sails.log.error('Query failed', cancelledQueryError());

          sinon.assert.calledOnce(error);
          sinon.assert.notCalled(warn);
          done();
        });
      });
    });
  });

  // Whether what a request is about to answer 500 with is the cancellation
  // of its queries after its client went away (#1919).
  describe('isCancelledOnAbort', () => {
    it('should recognise a cancelled query error', () => {
      should(
        inAbortedRequest(() => logger.isCancelledOnAbort(cancelledQueryError()))
      ).be.true();
    });

    it('should trust a message from a controller that caught the error itself', () => {
      should(
        inAbortedRequest(() =>
          logger.isCancelledOnAbort('An internal error occurred when getting X')
        )
      ).be.true();
      should(
        inAbortedRequest(() =>
          logger.isCancelledOnAbort({ code: 'E_SERVER_ERROR', message: 'x' })
        )
      ).be.true();
      should(inAbortedRequest(() => logger.isCancelledOnAbort())).be.true();
    });

    it('should keep an unrelated error as a server error', () => {
      should(
        inAbortedRequest(() =>
          logger.isCancelledOnAbort(
            Object.assign(new Error('read ETIMEDOUT'), { code: 'ETIMEDOUT' })
          )
        )
      ).be.false();
    });

    it('should be false outside an aborted request', () => {
      should(logger.isCancelledOnAbort(cancelledQueryError())).be.false();
      logger.run('test-no-abort', () => {
        should(logger.isCancelledOnAbort(cancelledQueryError())).be.false();
      });
    });
  });
});
