const EventEmitter = require('events');
const should = require('should');
const sinon = require('sinon');
const crashHandler = require('../../../api/utils/crashHandler');

// The handler is always installed on a fake process here: emitting
// 'uncaughtException' on the real one would take mocha down with it.
describe('crashHandler', () => {
  let proc;
  let exit;
  let fakeSails;
  let clock;

  const install = (overrides = {}) =>
    crashHandler.install({
      proc,
      exit,
      getSails: () => fakeSails,
      timeoutMs: 10000,
      ...overrides,
    });

  beforeEach(() => {
    proc = new EventEmitter();
    exit = sinon.stub();
    fakeSails = {
      isLifted: true,
      log: { error: sinon.stub() },
      lower: sinon.stub().callsFake((cb) => cb()),
    };
    clock = sinon.useFakeTimers();
  });

  afterEach(() => clock.restore());

  it('logs, lowers Sails and exits with 1 on uncaughtException', () => {
    install();
    proc.emit('uncaughtException', new Error('boom'), 'uncaughtException');

    sinon.assert.calledOnce(fakeSails.log.error);
    should(fakeSails.log.error.firstCall.args[0]).match(
      /\[crash\] uncaughtException/
    );
    should(fakeSails.log.error.firstCall.args[1]).match({
      origin: 'uncaughtException',
      stack: /boom/,
    });
    sinon.assert.calledOnce(fakeSails.lower);
    sinon.assert.calledOnceWithExactly(exit, 1);
  });

  it('exits after the hard cap when lowering never finishes', () => {
    fakeSails.lower = sinon.stub();
    install();
    proc.emit('uncaughtException', new Error('boom'));

    sinon.assert.notCalled(exit);
    clock.tick(9999);
    sinon.assert.notCalled(exit);
    clock.tick(1);
    sinon.assert.calledOnceWithExactly(exit, 1);
  });

  it('still exits when lowering throws', () => {
    fakeSails.lower = sinon.stub().throws(new Error('lower failed'));
    install();
    proc.emit('uncaughtException', new Error('boom'));

    sinon.assert.calledOnceWithExactly(exit, 1);
  });

  it('shuts down only once on repeated exceptions', () => {
    fakeSails.lower = sinon.stub();
    install();
    proc.emit('uncaughtException', new Error('first'));
    proc.emit('uncaughtException', new Error('second'));

    sinon.assert.calledTwice(fakeSails.log.error);
    sinon.assert.calledOnce(fakeSails.lower);
    clock.tick(10000);
    sinon.assert.calledOnce(exit);
  });

  it('exits immediately when Sails has not lifted', () => {
    fakeSails.isLifted = false;
    install();
    proc.emit('uncaughtException', new Error('boom'));

    sinon.assert.notCalled(fakeSails.lower);
    sinon.assert.calledOnceWithExactly(exit, 1);
  });

  it('falls back to console.error before Sails exists', () => {
    const consoleError = sinon.stub(console, 'error');
    try {
      install({ getSails: () => undefined });
      proc.emit('uncaughtException', new Error('boom'));
    } finally {
      consoleError.restore();
    }

    sinon.assert.calledOnce(consoleError);
    sinon.assert.calledOnceWithExactly(exit, 1);
  });

  it('logs an unhandledRejection and keeps running', () => {
    install();
    proc.emit('unhandledRejection', new Error('dropped promise'));

    sinon.assert.calledOnce(fakeSails.log.error);
    should(fakeSails.log.error.firstCall.args[0]).match(
      /\[crash\] unhandledRejection/
    );
    should(fakeSails.log.error.firstCall.args[1]).match({
      stack: /dropped promise/,
    });
    sinon.assert.notCalled(fakeSails.lower);
    sinon.assert.notCalled(exit);
  });

  it('logs a non-Error rejection reason', () => {
    install();
    proc.emit('unhandledRejection', 'plain string');

    should(fakeSails.log.error.firstCall.args[1]).match({
      stack: 'plain string',
    });
  });
});
