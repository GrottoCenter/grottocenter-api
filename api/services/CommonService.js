/**
 */

const _ = require('underscore.string');

module.exports = {
  /**
   * @param {string} sql - a sql string
   * @param {*[]} values - used to interpolate the string's ?
   *
   * @returns {Promise} which resolves to the succesfully queried strings
   */
  query: async (sql, values, connection) => {
    let query = sails.sendNativeQuery(sql, values || []);
    if (connection) {
      query = query.usingConnection(connection);
    }
    return query;
  },

  /**
   * @param {string} html - the html string to convert to text
   * @param {int} length - length to keep visible (remaining is completed by '...')
   *
   * @returns {string} the converted html string
   */
  convertHtmlToText: (html, length) =>
    _.prune(_.unescapeHTML(_.stripTags(html)), length),

  /**
   * Ensures a value is an array. If falsy, returns empty array. If not an array, wraps in array.
   * @param {*} val - Value to ensure is an array
   * @returns {Array}
   */
  ensureArray: (val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  },
};
