const ramda = require('ramda');

module.exports = {
  /**
   * Apply a function to each item of an array of data. If data[key] is not an Array, return it as is.
   * @param {string} key
   * @param {Array} data array of data to be converted
   * @param {(item) => Array} fn function to apply to each data item
   * @returns {Array | Object}
   */
  toList: (key, data, fn) => {
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
  toListFromController: (key, data, fn) => ({
    [key]: module.exports.toList(key, { [key]: data }, fn),
  }),

  convertIfObject: (data, fn) => (data instanceof Object ? fn(data) : data),

  getMainName: (source) => {
    let mainName = ramda.pathOr(null, ['name'], source); // from Elasticsearch, name is the mainName
    if (mainName === null && source.names instanceof Array) {
      mainName = source.names.find((name) => name.isMain);
      mainName = mainName === undefined ? null : mainName.name;
    }
    return mainName;
  },
};
