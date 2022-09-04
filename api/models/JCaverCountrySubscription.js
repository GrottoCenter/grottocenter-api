/**
 * JCaverCountrySubscription.js
 *
 * @description :: jCaverCountrySubscription model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_country_subscription',

  attributes: {
    country: {
      columnName: 'iso',
      model: 'TCountry',
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },
  },
};
