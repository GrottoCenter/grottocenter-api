/**
 * Runs `worker(item)` over `items` with at most `limit` calls in flight.
 *
 * On the first failure no new item is started, the calls already in flight are
 * awaited (so each one finishes what it began) and the first error is thrown.
 * That is what keeps a publisher's bookkeeping consistent when it stops.
 *
 * Pure: loads without Sails.
 */
module.exports = async (items, limit, worker) => {
  let next = 0;
  let failure = null;
  let failed = false;

  const lane = async () => {
    while (!failed && next < items.length) {
      const item = items[next];
      next += 1;
      try {
        // Sequential inside a lane; lanes run side by side
        // eslint-disable-next-line no-await-in-loop
        await worker(item);
      } catch (error) {
        if (!failed) {
          failed = true;
          failure = error;
        }
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, lane)
  );
  if (failed) throw failure;
};
