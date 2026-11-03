const should = require('should');
const mapLimit = require('../../../api/utils/mapLimit');

const tick = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('mapLimit', () => {
  it('runs the worker on every item, with at most `limit` calls in flight', async () => {
    let inFlight = 0;
    let peak = 0;
    const seen = [];
    await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (item) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await tick();
      await tick();
      seen.push(item);
      inFlight -= 1;
    });
    should(seen.sort()).deepEqual([1, 2, 3, 4, 5, 6, 7]);
    should(peak).equal(3);
  });

  it('resolves on an empty list', async () => {
    await mapLimit([], 4, () => {
      throw new Error('never called');
    });
  });

  it('starts nothing new after a failure, finishes what is in flight and throws the first error', async () => {
    const started = [];
    const finished = [];
    const failure = new Error('boom');
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async (item) => {
      started.push(item);
      await tick();
      if (item === 2) throw failure;
      await tick();
      finished.push(item);
    }).should.be.rejectedWith(failure);
    // Everything started was finished, except the failing item
    should(finished.sort()).deepEqual(started.filter((i) => i !== 2).sort());
    should(started.length).be.below(6);
  });
});
