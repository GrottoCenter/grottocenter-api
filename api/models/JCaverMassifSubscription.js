/**
 * JCaverMassifSubscription.js
 *
 * @description :: jCaverMassifSubscription model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_massif_subscription',

  attributes: {
    massif: {
      columnName: 'id_massif',
      model: 'TMassif',
    },

    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },
  },
};
