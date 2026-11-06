const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 100;

const readPositiveInt = (value) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const num = Number(value);
  return Number.isSafeInteger(num) && num >= 1 ? num : null;
};

/**
 * Read the `page` (1-based) and `size` pagination parameters of a list.
 *
 * Both are optional: `page` defaults to 1 and `size` to 50, and `size` is at
 * most 100. Returns `{ page, size, skip }` on success, `{ error }` with a
 * message for a 400 otherwise.
 *
 * @param {*} rawPage `req.param('page')`
 * @param {*} rawSize `req.param('size')`
 * @returns {{ page: number, size: number, skip: number } | { error: string }}
 */
const readPageParams = (rawPage, rawSize) => {
  const page = rawPage === undefined ? 1 : readPositiveInt(rawPage);
  if (page === null) {
    return { error: 'page must be a positive integer.' };
  }
  const size =
    rawSize === undefined ? PAGE_SIZE_DEFAULT : readPositiveInt(rawSize);
  if (size === null || size > PAGE_SIZE_MAX) {
    return { error: `size must be an integer between 1 and ${PAGE_SIZE_MAX}.` };
  }
  const skip = (page - 1) * size;
  if (!Number.isSafeInteger(skip)) {
    return { error: 'page is too large.' };
  }
  return { page, size, skip };
};

readPageParams.PAGE_SIZE_DEFAULT = PAGE_SIZE_DEFAULT;
readPageParams.PAGE_SIZE_MAX = PAGE_SIZE_MAX;

module.exports = readPageParams;
