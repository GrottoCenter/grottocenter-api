/**
 * Settles like `promise`, unless it takes longer than `ms`, in which case it
 * rejects with an Error whose `code` is 'E_TIMEOUT'.
 *
 * The timer is always cleared, so it never keeps the process alive. The
 * underlying operation is not cancelled: it keeps running and its outcome is
 * ignored.
 *
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} label used in the timeout error message
 * @returns {Promise}
 */
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        Object.assign(new Error(`${label} timed out after ${ms}ms`), {
          code: 'E_TIMEOUT',
        })
      );
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

module.exports = withTimeout;
