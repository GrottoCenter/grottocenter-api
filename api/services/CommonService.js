const _ = require('underscore.string');

module.exports = {
  /**
   * @param {Model} model - an instance of a sails model
   * @param {string} sql - a sql string
   * @param {*[]} values - used to interpolate the string's ?
   *
   * @returns {Promise} which resolves to the succesfully queried strings
   */
  query: function(model, sql, values) {
    values = values || [];
    return new Promise((resolve, reject) => {
      model.query(sql, values, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  },

  /**
   * @param {string} html - the html string to convert to text
   * @param {int} length - length to keep visible (remaining is completed by '...')
   *
   * @returns {string} the converted html string
   */
  convertHtmlToText: function(html, length) {
    return _.prune(_.unescapeHTML(_.stripTags(html)), length);
  }
};
