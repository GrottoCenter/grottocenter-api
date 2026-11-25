const should = require('should');
const sinon = require('sinon');
const {
  ping,
  withHeartbeat,
  resetThrottle,
} = require('../../../api/utils/heartbeat');

const URL = 'https://uptime.betterstack.com/api/v1/heartbeat/abc123';

describe('heartbeat', () => {
  let fetchImpl;
  let log;

  beforeEach(() => {
    resetThrottle();
    fetchImpl = sinon.stub().resolves({ ok: true, status: 200 });
    log = sinon.stub();
  });

  describe('ping()', () => {
    it('does nothing without a URL', async () => {
      should(await ping(undefined, { fetchImpl, log })).be.false();
      should(await ping('', { fetchImpl, log })).be.false();
      sinon.assert.notCalled(fetchImpl);
    });

    it('calls the URL on success and URL/fail on failure', async () => {
      should(await ping(URL, { fetchImpl, log })).be.true();
      should(fetchImpl.firstCall.args[0]).equal(URL);
      await ping(`${URL}/`, { failed: true, fetchImpl, log });
      should(fetchImpl.secondCall.args[0]).equal(`${URL}/fail`);
    });

    it('sends a timeout signal', async () => {
      await ping(URL, { fetchImpl, log });
      should(fetchImpl.firstCall.args[1].signal).be.instanceOf(AbortSignal);
    });

    [
      'http://example.com/x',
      'ftp://x.io/a',
      'https://u:p@x.io/a',
      'https://x.io/a b',
      'not a url',
    ].forEach((bad) => {
      it(`ignores the invalid URL "${bad}" without logging it`, async () => {
        should(await ping(bad, { name: 'job', fetchImpl, log })).be.false();
        sinon.assert.notCalled(fetchImpl);
        sinon.assert.calledOnce(log);
        should(log.firstCall.args[1]).not.containEql(bad);
      });
    });

    it('never throws, and never logs the URL, when the monitor is unreachable', async () => {
      fetchImpl.rejects(
        Object.assign(new Error(`boom ${URL}`), { name: 'TimeoutError' })
      );
      should(await ping(URL, { name: 'job', fetchImpl, log })).be.false();
      should(log.firstCall.args[1])
        .containEql('TimeoutError')
        .and.not.containEql(URL);
    });

    it('returns false when the monitor answers an error status', async () => {
      fetchImpl.resolves({ ok: false, status: 404 });
      should(await ping(URL, { name: 'job', fetchImpl, log })).be.false();
      should(log.firstCall.args[1]).containEql('404');
    });
  });

  describe('withHeartbeat()', () => {
    const wrap = (handler, extra = {}) =>
      withHeartbeat(handler, {
        name: 'job',
        getUrl: () => URL,
        fetchImpl,
        log,
        ...extra,
      });

    it('returns the handler result and passes its arguments', async () => {
      const handler = sinon.stub().resolves(42);
      should(await wrap(handler)('a', 'b')).equal(42);
      sinon.assert.calledWith(handler, 'a', 'b');
      sinon.assert.calledOnceWithExactly(fetchImpl, URL, sinon.match.object);
    });

    it('pings /fail and rethrows the same error when the handler throws', async () => {
      const error = new Error('nope');
      await wrap(sinon.stub().rejects(error))().should.be.rejectedWith(error);
      should(fetchImpl.firstCall.args[0]).equal(`${URL}/fail`);
    });

    it('still rethrows the job error when the monitor is down', async () => {
      fetchImpl.rejects(new Error('down'));
      await wrap(
        sinon.stub().rejects(new Error('job error'))
      )().should.be.rejectedWith('job error');
    });

    it('still returns the result when the monitor is down', async () => {
      fetchImpl.rejects(new Error('down'));
      should(await wrap(sinon.stub().resolves('ok'))()).equal('ok');
    });

    it('does not ping a job with no URL', async () => {
      const wrapped = wrap(sinon.stub().resolves(), {
        getUrl: () => undefined,
      });
      await wrapped();
      await wrapped.call(null);
      sinon.assert.notCalled(fetchImpl);
    });

    it('reads the URL at run time', async () => {
      let url;
      const wrapped = wrap(sinon.stub().resolves(), { getUrl: () => url });
      await wrapped();
      sinon.assert.notCalled(fetchImpl);
      url = URL;
      await wrapped();
      sinon.assert.calledOnce(fetchImpl);
    });

    it('throttles successes but never failures', async () => {
      let time = 1000;
      const handler = sinon.stub();
      handler.onCall(0).resolves();
      handler.onCall(1).resolves();
      handler.onCall(2).rejects(new Error('x'));
      handler.onCall(3).resolves();
      const wrapped = wrap(handler, { minIntervalMs: 300000, now: () => time });
      await wrapped(); // pinged
      time += 60000;
      await wrapped(); // throttled
      sinon.assert.calledOnce(fetchImpl);
      await wrapped().should.be.rejected(); // failure always pings
      sinon.assert.calledTwice(fetchImpl);
      time += 300000;
      await wrapped(); // interval elapsed
      sinon.assert.calledThrice(fetchImpl);
    });

    it('lets the success right after a failure through, whatever the throttle', async () => {
      let time = 1000;
      const handler = sinon.stub();
      handler.onCall(0).resolves();
      handler.onCall(1).rejects(new Error('x'));
      handler.onCall(2).resolves();
      handler.onCall(3).resolves();
      const wrapped = wrap(handler, { minIntervalMs: 300000, now: () => time });
      await wrapped(); // pinged
      time += 60000;
      await wrapped().should.be.rejected(); // /fail, throttle cleared
      time += 60000;
      await wrapped(); // pinged at once: it resolves the incident
      sinon.assert.calledThrice(fetchImpl);
      should(fetchImpl.thirdCall.args[0]).equal(URL);
      time += 60000;
      await wrapped(); // throttled again
      sinon.assert.calledThrice(fetchImpl);
    });

    describe('with the retry metadata of the job', () => {
      const failing = () => sinon.stub().rejects(new Error('x'));

      it('does not report a failed attempt that pg-boss will retry', async () => {
        const wrapped = wrap(failing());
        await wrapped([
          { retryCount: 0, retryLimit: 1 },
        ]).should.be.rejectedWith('x');
        sinon.assert.notCalled(fetchImpl);
      });

      it('reports the last attempt failing', async () => {
        const wrapped = wrap(failing());
        await wrapped([
          { retryCount: 1, retryLimit: 1 },
        ]).should.be.rejectedWith('x');
        should(fetchImpl.firstCall.args[0]).equal(`${URL}/fail`);
      });

      it('follows the limit of the job, not a constant of the code', async () => {
        const wrapped = wrap(failing());
        await wrapped([
          { retryCount: 1, retryLimit: 2 },
        ]).should.be.rejectedWith('x');
        sinon.assert.notCalled(fetchImpl);
        await wrapped([
          { retryCount: 2, retryLimit: 2 },
        ]).should.be.rejectedWith('x');
        sinon.assert.calledOnce(fetchImpl);
      });

      it('reports every failure when the job carries no metadata', async () => {
        const wrapped = wrap(failing());
        await wrapped([{ retryCount: 0 }]).should.be.rejectedWith('x');
        await wrapped([{}]).should.be.rejectedWith('x');
        await wrapped().should.be.rejectedWith('x');
        sinon.assert.calledThrice(fetchImpl);
      });

      it('reports every failure when the queue does not retry', async () => {
        const wrapped = wrap(failing());
        await wrapped([
          { retryCount: 0, retryLimit: 0 },
        ]).should.be.rejectedWith('x');
        should(fetchImpl.firstCall.args[0]).equal(`${URL}/fail`);
      });

      it('reports the success of the retry', async () => {
        const wrapped = wrap(sinon.stub().resolves());
        await wrapped([{ retryCount: 1, retryLimit: 1 }]);
        should(fetchImpl.firstCall.args[0]).equal(URL);
      });
    });

    it('retries at the next run when a success ping was not acknowledged', async () => {
      fetchImpl.onFirstCall().rejects(new Error('down'));
      const wrapped = wrap(sinon.stub().resolves(), { minIntervalMs: 300000 });
      await wrapped();
      await wrapped();
      sinon.assert.calledTwice(fetchImpl);
    });
  });
});
