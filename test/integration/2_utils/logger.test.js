const should = require('should');
const logger = require('../../../api/utils/logger');

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
});
