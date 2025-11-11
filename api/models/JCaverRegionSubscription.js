/**
 * JCaverRegionSubscription.js
 *
 * @description :: Junction table for caver region subscriptions
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_region_subscription',

  attributes: {
    region: {
      columnName: 'id_region',
      model: 'TISO31662',
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },
  },
};
