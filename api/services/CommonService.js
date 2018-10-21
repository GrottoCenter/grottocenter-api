const _ = require('underscore.string');

module.exports = {
  /**
   * @param {string} sql - a sql string
   * @param {*[]} values - used to interpolate the string's ?
   *
   * @returns {Promise} which resolves to the succesfully queried strings
   */
  query: async function(sql, values) {
    let controlledValues = values || [];
    return await sails.sendNativeQuery(sql, controlledValues);
  },

  /**
   * @param {string} html - the html string to convert to text
   * @param {int} length - length to keep visible (remaining is completed by '...')
   *
   * @returns {string} the converted html string
   */
  convertHtmlToText: function(html, length) {
    return _.prune(_.unescapeHTML(_.stripTags(html)), length);
  },

  difference: function(num1, num2) {
    return (num1 > num2) ? num1 - num2 : num2 - num1; // TODO review this method and add unit test
  }
};
