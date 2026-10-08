const should = require('should');
const sinon = require('sinon');
const withTimeout = require('../../../api/utils/withTimeout');

describe('withTimeout', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('resolves with the value of a promise that settles in time', async () => {
    const result = await withTimeout(Promise.resolve(42), 50, 'Probe');
    should(result).equal(42);
  });

  it('rejects with the original error of a promise that rejects in time', async () => {
    const error = new Error('boom');
    await should(
      withTimeout(Promise.reject(error), 50, 'Probe')
    ).be.rejectedWith(error);
  });

  it('rejects with an E_TIMEOUT error naming the label when the promise never settles', async () => {
    const err = await withTimeout(new Promise(() => {}), 10, 'Probe').then(
      () => should.fail('expected a rejection'),
      (e) => e
    );
    should(err).be.an.Error();
    should(err.code).equal('E_TIMEOUT');
    should(err.message).equal('Probe timed out after 10ms');
  });

  it('clears its timer once the promise settles', async () => {
    const clearSpy = sinon.spy(global, 'clearTimeout');
    await withTimeout(Promise.resolve('done'), 60000, 'Probe');
    should(clearSpy.calledOnce).be.true();
  });

  it('clears its timer when the promise rejects', async () => {
    const clearSpy = sinon.spy(global, 'clearTimeout');
    await withTimeout(Promise.reject(new Error('x')), 60000, 'Probe').catch(
      () => {}
    );
    should(clearSpy.calledOnce).be.true();
  });
});
