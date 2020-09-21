/**
 * JCaverGroup.js
 *
 * @description :: jCaverGroup model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  tableName: 'j_caver_group',

  attributes: {
    caver: {
      columnName: 'id_caver',
      model: 'TCaver',
    },

    group: {
      columnName: 'id_group',
      model: 'TGroup',
    },
  },
};
