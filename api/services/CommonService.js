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
  query: async (sql, values) => sails.sendNativeQuery(sql, values || []),

  /**
   * @param {string} html - the html string to convert to text
   * @param {int} length - length to keep visible (remaining is completed by '...')
   *
   * @returns {string} the converted html string
   */
  convertHtmlToText: (html, length) =>
    _.prune(_.unescapeHTML(_.stripTags(html)), length),

  // TODO review this method and add unit test
  difference: (num1, num2) => (num1 > num2 ? num1 - num2 : num2 - num1),
};
