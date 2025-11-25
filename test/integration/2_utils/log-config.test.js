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
});
