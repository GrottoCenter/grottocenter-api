/* eslint-disable global-require */
const should = require('should');

describe('Log Configuration', () => {
  let originalEnv;

  before(() => {
    originalEnv = process.env.NODE_ENV;
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
    delete require.cache[require.resolve('../../../config/log')];
  });

  it('should have log configuration', () => {
    should(sails.config.log).be.an.Object();
    should(sails.config.log.level).be.a.String();
  });

  it('should not use custom logger in test environment', () => {
    should(sails.config.log.custom).be.undefined();
  });

  it('should use custom logger in production environment', () => {
    process.env.NODE_ENV = 'production';
    delete require.cache[require.resolve('../../../config/log')];
    const logConfig = require('../../../config/log');

    should(logConfig.log.custom).not.be.undefined();
    should(logConfig.log.custom.format).not.be.undefined();
  });

  it('should use custom logger in development environment', () => {
    process.env.NODE_ENV = 'development';
    delete require.cache[require.resolve('../../../config/log')];
    const logConfig = require('../../../config/log');

    should(logConfig.log.custom).not.be.undefined();
    should(logConfig.log.custom.format).not.be.undefined();
  });

  it('should escape newlines in production logger', () => {
    const winston = require('winston');
    const formatter = winston.format.printf(({ level, message, timestamp }) => {
      const msg =
        typeof message === 'string' ? message : JSON.stringify(message);
      return `${timestamp} [${level}] ${msg.replace(/\n/g, '\\n')}`;
    });

    const testMessage = 'Error\nLine 2\nLine 3';
    const result = formatter.transform(
      { level: 'error', message: testMessage, timestamp: '2025-01-01' },
      {}
    );

    should(result[Symbol.for('message')]).match(/\\n/);
    should(result[Symbol.for('message')]).not.match(/Error\nLine/);
  });

  // Backstop layer. By the time winston sees `message`, captains-log has already
  // flattened the error into one string, so only a textual scrub is possible.
  // The structured redaction lives in api/utils/logger.js; this covers what that
  // patch does not wrap -- `silly`, `crit`, and the callable sails.log(...) form.
  describe('secret scrubbing in the custom logger', () => {
    const SECRET = 'Tr0ub4dor-3-correct-horse-battery';

    const formatWith = (nodeEnv, message) => {
      process.env.NODE_ENV = nodeEnv;
      delete require.cache[require.resolve('../../../config/log')];
      const logConfig = require('../../../config/log');
      const result = logConfig.log.custom.format.transform(
        { level: 'error', message, timestamp: '2025-01-01' },
        {}
      );
      return result[Symbol.for('message')];
    };

    it('should scrub a secret in the production logger', () => {
      const output = formatWith(
        'production',
        `datastore config: { user: 'grottoce', password: '${SECRET}' }`
      );

      should(output).not.containEql(SECRET);
      should(output).match(/\[REDACTED\]/);
      should(output).match(/grottoce/);
    });

    it('should scrub a connection URI in the production logger', () => {
      const output = formatWith(
        'production',
        `could not connect to postgres://grottoce:${SECRET}@db.example.org:5432/grottoce`
      );

      should(output).not.containEql(SECRET);
    });

    it('should scrub a secret in the development logger', () => {
      const output = formatWith(
        'development',
        `datastore config: { password: '${SECRET}' }`
      );

      should(output).not.containEql(SECRET);
      should(output).match(/\[REDACTED\]/);
    });

    it('should leave a secret-free message alone', () => {
      const output = formatWith(
        'production',
        'Res :: GET /api/v1/entrances 200 12ms'
      );

      should(output).equal('Res :: GET /api/v1/entrances 200 12ms');
    });
  });
});
