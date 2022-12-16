const ramda = require('ramda');

module.exports = {
  /**
   * Apply a function to each item of an array of data. If data[key] is not an Array, return it as is.
   * @param {string} key
   * @param {Object} data Object containing the `key` to convert
   * @param {(Object) => Object} fn function to apply to each data item
   * @param {Boolean} filterDeleted If true then all items with the isDeleted property set
   *                      to true will be filtered from the array before applying
   *                      the given function to apply.
   * @returns Array
   */
  toList: (key, data, fn, { filterDeleted = true } = {}) => {
    if (!data[key]) {
      return [];
    }
    if (!(data[key] instanceof Array)) {
      if (filterDeleted && data[key].isDeleted) return null;
      return data[key];
    }
    return data[key]
      .filter((obj) => !filterDeleted || !obj.isDeleted)
      .map((item) => fn(item));
  },

  /**
   * Controllers expect the results to be returned in an object {key: results}
   * @param {string} key
   * @param {Array} data
   * @param {(Object) => Object} fn @see toList
   * @param {Boolean} filterDeleted @see toList
   * @returns {Object}
   */
  toListFromController: (key, data, fn, { filterDeleted = true } = {}) => ({
    [key]: module.exports.toList(key, { [key]: data }, fn, {
      filterDeleted,
    }),
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
