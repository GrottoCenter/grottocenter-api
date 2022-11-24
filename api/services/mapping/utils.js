module.exports = {
  /**
   * Apply a function to each item of an array of data. If data[key] is not an Array, return it as is.
   * @param {string} key
   * @param {Array} data array of data to be converted
   * @param {(item) => Array} fn function to apply to each data item
   * @returns {Array | Object}
   */
  convertToList: (key, data, fn) => {
    // Check arguments
    if (!data[key]) {
      return [];
    }
    if (!(data[key] instanceof Array)) {
      return data[key];
    }

    // Compute
    const results = [];
    data[key].forEach((item) => results.push(fn(item)));
    return results;
  },

  /**
   * Controllers expect the results to be returned in an object {key: results}
   * @param {string} key
   * @param {Array} data
   * @param {*} fn
   * @returns {Object}
   */
  convertToListFromController: (key, data, fn) => ({
    [key]: module.exports.convertToList(key, { [key]: data }, fn),
  }),
};
